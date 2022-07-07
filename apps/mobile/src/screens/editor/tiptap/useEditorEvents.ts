import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, InteractionManager, NativeEventSubscription } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview';
import { AuthMode } from '../../../components/auth';
import { Properties } from '../../../components/properties';
import { DDS } from '../../../services/device-detection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../../services/event-manager';
import Navigation from '../../../services/navigation';
import { useEditorStore } from '../../../stores/use-editor-store';
import { useSettingStore } from '../../../stores/use-setting-store';
import { useTagStore } from '../../../stores/use-tag-store';
import { useUserStore } from '../../../stores/use-user-store';
import umami from '../../../utils/analytics/index';
import { db } from '../../../utils/database';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenLoginDialog,
  eOpenPremiumDialog,
  eOpenPublishNoteDialog,
  eOpenTagsDialog
} from '../../../utils/events';
import filesystem from '../../../utils/filesystem';
import { tabBarRef } from '../../../utils/global-refs';
import { NoteType } from '../../../utils/types';
import { useDragState } from '../../settings/editor/state';
import picker from './picker';
import { EditorMessage, EditorProps, useEditorType } from './types';
import { EditorEvents, editorState } from './utils';

export const EventTypes = {
  selection: 'editor-event:selection',
  content: 'editor-event:content',
  title: 'editor-event:title',
  scroll: 'editor-event:scroll',
  history: 'editor-event:history',
  newtag: 'editor-event:newtag',
  tag: 'editor-event:tag',
  filepicker: 'editor-event:picker',
  download: 'editor-event:download-attachment',
  logger: 'native:logger',
  back: 'editor-event:back',
  pro: 'editor-event:pro',
  monograph: 'editor-event:monograph',
  properties: 'editor-event:properties'
};

const publishNote = async (editor: useEditorType) => {
  const user = useUserStore.getState().user;
  if (!user) {
    ToastEvent.show({
      heading: 'Login required',
      message: 'Login to publish',
      context: 'global',
      func: () => {
        eSendEvent(eOpenLoginDialog);
      },
      actionText: 'Login'
    });
    return;
  }

  if (!user.isEmailConfirmed) {
    ToastEvent.show({
      heading: 'Email not verified',
      message: 'Please verify your email first.',
      context: 'global'
    });
    return;
  }
  const currentNote = editor?.note?.current;
  if (currentNote?.id) {
    let note = db.notes?.note(currentNote.id)?.data as NoteType;
    if (note?.locked) {
      ToastEvent.show({
        heading: 'Locked notes cannot be published',
        type: 'error',
        context: 'global'
      });
      return;
    }
    if (editorState().isFocused) {
      editorState().isFocused = true;
    }
    eSendEvent(eOpenPublishNoteDialog, note);
  }
};

const showActionsheet = async (editor: useEditorType) => {
  const currentNote = editor?.note?.current;
  if (currentNote?.id) {
    let note = db.notes?.note(currentNote.id)?.data as NoteType;

    if (editorState().isFocused || editorState().isFocused) {
      editorState().isFocused = true;
    }

    Properties.present(note, ['Dark Mode']);
  } else {
    ToastEvent.show({
      heading: 'Start writing to create a new note',
      type: 'success',
      context: 'global'
    });
  }
};

export const useEditorEvents = (
  editor: useEditorType,
  { readonly: editorPropReadonly, noHeader, noToolbar }: Partial<EditorProps>
) => {
  const deviceMode = useSettingStore(state => state.deviceMode);
  const fullscreen = useSettingStore(state => state.fullscreen);
  const handleBack = useRef<NativeEventSubscription>();
  const readonly = useEditorStore(state => state.readonly);
  const isPremium = useUserStore(state => state.premium);
  const tools = useDragState(state => state.data);
  if (!editor) return null;

  useEffect(() => {
    console.log('settings', readonly);
    editor.commands.setSettings({
      deviceMode: deviceMode || 'mobile',
      fullscreen: fullscreen,
      premium: isPremium,
      readonly: readonly || editorPropReadonly,
      tools: tools,
      noHeader: noHeader,
      noToolbar: readonly || editorPropReadonly || noToolbar
    });
  }, [fullscreen, isPremium, readonly, editor.sessionId, editor.loading, tools, editor.commands]);

  const onBackPress = useCallback(async () => {
    const editorHandledBack = await editor.commands.handleBack();
    if (!editorHandledBack) {
      logger.info('editor handled back event', editorHandledBack);
      return;
    }
    setTimeout(async () => {
      if (deviceMode !== 'mobile' && fullscreen) {
        if (fullscreen) {
          eSendEvent(eCloseFullscreenEditor);
        }
        return;
      }

      if (deviceMode === 'mobile') {
        editorState().movedAway = true;
        tabBarRef.current?.goToPage(0);
      }
      eSendEvent('historyEvent', {
        undo: 0,
        redo: 0
      });
      setImmediate(() => useEditorStore.getState().setCurrentlyEditingNote(null));
      editorState().currentlyEditing = false;
      editor.reset();
    }, 1);
  }, []);

  const onHardwareBackPress = useCallback(() => {
    if (editorState().currentlyEditing) {
      onBackPress();
      return true;
    }
  }, []);

  const onLoadNote = useCallback(async () => {
    InteractionManager.runAfterInteractions(() => {
      if (!DDS.isTab) {
        handleBack.current = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
      }
    });
  }, []);

  const onCallClear = useCallback(async (value: string) => {
    if (value === 'removeHandler') {
      if (handleBack.current) {
        handleBack.current.remove();
      }
      return;
    }
    if (value === 'addHandler') {
      if (handleBack.current) {
        handleBack.current.remove();
      }

      handleBack.current = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
      return;
    }
    if (editorState().currentlyEditing) {
      await onBackPress();
    }
  }, []);

  useEffect(() => {
    if (fullscreen && DDS.isTab) {
      handleBack.current = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    }

    return () => {
      if (handleBack.current) {
        handleBack.current.remove();
      }
    };
  }, [fullscreen]);

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote + editor.editorId, onLoadNote);
    eSubscribeEvent(eClearEditor + editor.editorId, onCallClear);
    return () => {
      eUnSubscribeEvent(eClearEditor, onCallClear);
      eUnSubscribeEvent(eOnLoadNote, onLoadNote);
    };
  }, []);

  const onMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    let editorMessage = JSON.parse(data) as EditorMessage;

    logger.info('editor', editorMessage.type);
    if (
      editorMessage.sessionId !== editor.sessionId &&
      editorMessage.type !== EditorEvents.status
    ) {
      logger.error(
        'editor',
        'invalid session',
        editorMessage.type,
        editor.sessionId,
        editorMessage.sessionId
      );

      return;
    }
    switch (editorMessage.type) {
      case EventTypes.logger:
        logger.info('[WEBVIEW LOG]', editorMessage.value);
        break;
      case EventTypes.content:
        editor.saveContent({
          type: editorMessage.type,
          content: editorMessage.value
        });
        break;
      case EventTypes.selection:
        break;
      case EventTypes.title:
        editor.saveContent({
          type: editorMessage.type,
          title: editorMessage.value
        });
        break;
      case EventTypes.newtag:
        if (!editor.note.current) return;
        eSendEvent(eOpenTagsDialog, editor.note.current);
        break;
      case EventTypes.tag:
        if (editorMessage.value) {
          if (!editor.note.current) return;
          db.notes
            //@ts-ignore
            ?.note(editor.note.current?.id)
            .untag(editorMessage.value)
            .then(async () => {
              useTagStore.getState().setTags();
              await editor.commands.setTags(editor.note.current);
              Navigation.queueRoutesForUpdate(
                'ColoredNotes',
                'Notes',
                'TaggedNotes',
                'TopicNotes',
                'Tags'
              );
            });
        }
        break;
      case EventTypes.filepicker:
        picker.pick({ type: editorMessage.value });
        break;
      case EventTypes.download:
        console.log('download attachment request', editorMessage.value);
        filesystem.downloadAttachment(editorMessage.value?.hash, true);
        break;
      case EventTypes.pro:
        if (editor.state.current?.isFocused) {
          editor.state.current.isFocused = true;
        }
        umami.pageView('/pro-screen', '/editor');
        eSendEvent(eOpenPremiumDialog);
        break;
      case EventTypes.monograph:
        publishNote(editor);
        break;
      case EventTypes.properties:
        showActionsheet(editor);
        break;
      case EventTypes.back:
        onBackPress();
        break;
      default:
        console.log(
          'unhandled event recieved from editor: ',
          editorMessage.type,
          editorMessage.value
        );
        break;
    }
    eSendEvent(editorMessage.type, editorMessage);
  };

  return onMessage;
};
