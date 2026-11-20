//! `NotesnookEditor`: the native editor's `RichTextView` as a react-native-gpui
//! host component. HTML goes in through `setContent` and comes out through
//! `onSave`; everything else is the editor's host API (`run_commands`,
//! `set_queries`, `EditorEvent`, host attachments) carried over JSON strings.

rn_gpui_module::include_specs!();

use std::cell::Cell;
use std::rc::Rc;
use std::time::Duration;

use editor_core::view::element::{AttachmentData, EditorEvent, EditorQuery, RichTextView};
use editor_core::Engine;
use gpui::{div, prelude::*, AnyElement, App, AppContext as _, Entity, Subscription, Window};
use serde_json::Value;

const SAVE_DELAY: Duration = Duration::from_millis(500);

enum Pending {
    Run(String),
    SetQueries(String),
    SetContent(String),
    RequestSave,
    AttachmentReady(u64, String),
}

#[derive(Default)]
struct Desired {
    readonly: bool,
    theme: String,
    settings: String,
}

struct NotesnookEditor {
    sender: NotesnookEditorEventSender,
    view: Option<Entity<RichTextView>>,
    error: Option<String>,
    _subscription: Option<Subscription>,
    pending: Vec<Pending>,
    desired: Desired,
    applied: Desired,
    applied_once: bool,
    save_generation: Rc<Cell<u64>>,
}

fn new_engine() -> anyhow::Result<Engine> {
    Ok(Engine::with_host(Box::new(host_quickjs::QuickJsHost::new()?)))
}

fn save(view: &Entity<RichTextView>, sender: &NotesnookEditorEventSender, app: &mut App) {
    let (revision, html) = view.read_with(app, |view, _| (view.manifest_revision(), view.html()));
    match html {
        Ok(html) => sender.save(OnSave {
            revision: revision as f64,
            html,
        }),
        Err(error) => eprintln!("NotesnookEditor: saving failed: {error:#}"),
    }
}

fn forward(
    view: &Entity<RichTextView>,
    event: &EditorEvent,
    sender: &NotesnookEditorEventSender,
    generation: &Rc<Cell<u64>>,
    app: &mut App,
) {
    match event {
        EditorEvent::QueryResults { revision, changed } => {
            sender.query_results(OnQueryResults {
                revision: *revision as f64,
                changed: Value::Object(changed.clone()).to_string(),
            })
        }
        EditorEvent::ContentChanged { revision } => {
            sender.content_change(OnContentChange {
                revision: *revision as f64,
            });
            let ticket = generation.get() + 1;
            generation.set(ticket);
            let (view, sender, generation) = (view.clone(), sender.clone(), generation.clone());
            app.spawn(async move |cx| {
                cx.background_executor().timer(SAVE_DELAY).await;
                if generation.get() == ticket {
                    let _ = cx.update(|app| save(&view, &sender, app));
                }
            })
            .detach();
        }
        EditorEvent::HostAction(action) => sender.host_action(OnHostAction {
            kind: action.kind.clone(),
            payload: action.payload.to_string(),
        }),
        EditorEvent::AttachmentRequest {
            id,
            hash,
            mime,
            url,
        } => sender.attachment_request(OnAttachmentRequest {
            id: *id as f64,
            hash: hash.clone().unwrap_or_default(),
            mime: mime.clone().unwrap_or_default(),
            url: url.clone().unwrap_or_default(),
        }),
        _ => {}
    }
}

impl NotesnookEditor {
    fn start(&mut self, window: &mut Window, app: &mut App) {
        let engine = match new_engine() {
            Ok(engine) => engine,
            Err(error) => {
                self.error = Some(format!("The editor engine did not start: {error:#}"));
                return;
            }
        };
        let view = app.new(|cx| {
            let mut view =
                RichTextView::new(engine, window, cx).expect("start native rich text view");
            view.use_host_attachments(cx);
            view
        });
        let sender = self.sender.clone();
        let generation = self.save_generation.clone();
        self._subscription = Some(app.subscribe(&view, move |view, event: &EditorEvent, app| {
            forward(&view, event, &sender, &generation, app)
        }));
        self.view = Some(view);
    }
}

impl NotesnookEditorSpec for NotesnookEditor {
    fn create(props: &NotesnookEditorProps, cx: &mut NotesnookEditorContext) -> Self {
        Self {
            sender: cx.event_sender(),
            view: None,
            error: None,
            _subscription: None,
            pending: Vec::new(),
            desired: Desired {
                readonly: props.readonly(),
                theme: props.theme().to_string(),
                settings: props.settings().to_string(),
            },
            applied: Desired::default(),
            applied_once: false,
            save_generation: Rc::new(Cell::new(0)),
        }
    }

    fn update(
        &mut self,
        props: &NotesnookEditorProps,
        _changed: NotesnookEditorChanged,
        _cx: &mut NotesnookEditorContext,
    ) {
        self.desired = Desired {
            readonly: props.readonly(),
            theme: props.theme().to_string(),
            settings: props.settings().to_string(),
        };
    }

    fn render(
        &mut self,
        _props: &NotesnookEditorProps,
        window: &mut Window,
        cx: &mut NotesnookEditorContext,
    ) -> AnyElement {
        let Some(app) = cx.app() else {
            return div().size_full().into_any_element();
        };
        if self.view.is_none() && self.error.is_none() {
            self.start(window, app);
        }
        if let Some(error) = &self.error {
            return div().size_full().child(error.clone()).into_any_element();
        }
        self.apply(app);
        match &self.view {
            Some(view) => div().size_full().child(view.clone()).into_any_element(),
            None => div().size_full().into_any_element(),
        }
    }

    fn run(&mut self, commands: String, cx: &mut NotesnookEditorContext) {
        self.dispatch(Pending::Run(commands), cx);
    }

    fn set_queries(&mut self, queries: String, cx: &mut NotesnookEditorContext) {
        self.dispatch(Pending::SetQueries(queries), cx);
    }

    fn focus(&mut self, _position: String, cx: &mut NotesnookEditorContext) {
        if let Some(view) = self.view.clone() {
            cx.with_window(|window, app| view.update(app, |view, cx| view.focus(window, cx)));
        }
    }

    fn set_content(&mut self, html: String, cx: &mut NotesnookEditorContext) {
        self.dispatch(Pending::SetContent(html), cx);
    }

    fn request_save(&mut self, cx: &mut NotesnookEditorContext) {
        self.dispatch(Pending::RequestSave, cx);
    }

    fn attachment_ready(&mut self, id: f64, path: String, cx: &mut NotesnookEditorContext) {
        self.dispatch(Pending::AttachmentReady(id as u64, path), cx);
    }
}

impl NotesnookEditor {
    fn dispatch(&mut self, command: Pending, cx: &mut NotesnookEditorContext) {
        self.pending.push(command);
        if self.view.is_some() {
            if let Some(app) = cx.app() {
                self.flush(app);
            }
        }
    }

    fn flush(&mut self, app: &mut App) {
        let Some(view) = self.view.clone() else {
            return;
        };
        for command in std::mem::take(&mut self.pending) {
            match command {
                Pending::Run(json) => match serde_json::from_str::<Value>(&json) {
                    Ok(commands) => {
                        view.update(app, |view, cx| view.run_commands(commands, cx));
                    }
                    Err(error) => eprintln!("NotesnookEditor: bad commands: {error}"),
                },
                Pending::SetQueries(json) => {
                    match serde_json::from_str::<Vec<EditorQuery>>(&json) {
                        Ok(queries) => view.update(app, |view, cx| view.set_queries(queries, cx)),
                        Err(error) => eprintln!("NotesnookEditor: bad queries: {error}"),
                    }
                }
                Pending::SetContent(html) => {
                    let result = view.update(app, |view, cx| view.set_html(&html, cx));
                    if let Err(error) = result {
                        eprintln!("NotesnookEditor: loading content failed: {error:#}");
                    }
                }
                Pending::RequestSave => save(&view, &self.sender, app),
                Pending::AttachmentReady(id, path) => view.update(app, |view, _| {
                    let data = (!path.is_empty()).then(|| AttachmentData::Path(path.into()));
                    view.attachment_ready(id, data);
                }),
            }
        }
    }

    fn apply(&mut self, app: &mut App) {
        let Some(view) = self.view.clone() else {
            return;
        };
        let first = !self.applied_once;
        if first || self.desired.readonly != self.applied.readonly {
            let editable = !self.desired.readonly;
            view.update(app, |view, cx| view.set_editable(editable, cx));
            self.applied.readonly = self.desired.readonly;
        }
        if !self.desired.theme.is_empty() && self.desired.theme != self.applied.theme {
            let theme = self.desired.theme.clone();
            let result = view.update(app, |view, cx| view.set_theme(&theme, cx));
            if let Err(error) = result {
                eprintln!("NotesnookEditor: theme rejected: {error:#}");
            }
            self.applied.theme = self.desired.theme.clone();
        }
        if !self.desired.settings.is_empty() && self.desired.settings != self.applied.settings {
            if let Ok(Value::Object(settings)) = serde_json::from_str(&self.desired.settings) {
                view.update(app, |view, cx| {
                    for (name, value) in settings {
                        if let Some(on) = value.as_bool() {
                            view.set_view_setting(&name, on, cx);
                        }
                    }
                });
            }
            self.applied.settings = self.desired.settings.clone();
        }
        self.applied_once = true;
        self.flush(app);
    }
}

pub fn rn_gpui_register() {
    react_native_gpui::host_component::register_component(
        notesnook_editor_component::<NotesnookEditor>(),
    );
}
