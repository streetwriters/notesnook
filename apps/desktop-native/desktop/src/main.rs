rn_gpui_module::include_specs!();

fn main() {
    rn_gpui_autolink::ensure_linked();
    #[cfg(debug_assertions)]
    if std::env::var_os("RN_GPUI_BUNDLE").is_none() {
        std::env::set_var("RN_GPUI_BUNDLE", env!("RN_GPUI_DEFAULT_BUNDLE"));
    }
    if std::env::var_os("RN_GPUI_APP_VERSION").is_none() {
        std::env::set_var("RN_GPUI_APP_VERSION", env!("RN_GPUI_APP_VERSION"));
    }

    let config = react_native_gpui::DesktopAppConfig::from_env_with_defaults(
        env!("RN_GPUI_APP_NAME"),
        env!("RN_GPUI_APP_ID"),
    )
    .window_title(env!("RN_GPUI_APP_NAME"))
    .window_size(1280.0, 800.0)
    .title_bar(react_native_gpui::WindowTitleBar::Hidden)
    .traffic_light_position(10.0, 14.0);

    react_native_gpui::run_with(config);
}
