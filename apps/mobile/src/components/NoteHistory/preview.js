import React, {useRef} from 'react';
import {Alert, View} from 'react-native';
import WebView from 'react-native-webview';
import {useTracked} from '../../provider';
import {useEditorStore} from '../../provider/stores';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/database';
import {eCloseProgressDialog, eOnLoadNote} from '../../utils/Events';
import {normalize} from '../../utils/SizeUtils';
import {getNote, sourceUri} from '../../views/Editor/Functions';
import { ActionIcon } from '../ActionIcon';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Paragraph from '../Typography/Paragraph';

export default function NotePreview({session, content}) {
  const [state] = useTracked();
  const {colors} = state;
  const webviewRef = useRef();

  const onLoad = async () => {
    let preview = await db.content.insertPlaceholders(
      content,
      'placeholder.svg'
    );

    console.log(preview, 'preview');
    postMessage('htmldiff', preview?.data);
    let theme = {...colors};
    theme.factor = normalize(1);
    postMessage('theme', JSON.stringify(theme));
  };

  function postMessage(type, value = null) {
    let message = {
      type: type,
      value
    };
    webviewRef.current?.postMessage(JSON.stringify(message));
  }

  const _onShouldStartLoadWithRequest = request => {
    if (request.url.includes('http')) {
      openLinkInBrowser(request.url, colors)
        .catch(e =>
          ToastEvent.show({
            title: 'Failed to open link',
            message: e.message,
            type: 'success',
            context: 'local'
          })
        )
        .then(r => {
          console.log('closed');
        });

      return false;
    } else {
      return true;
    }
  };

  async function restore() {
    await db.noteHistory.restore(session.id);
    if (useEditorStore.getState()?.currentEditingNote === session?.noteId) {
      if (getNote()) {
        eSendEvent(eOnLoadNote, {...getNote(), forced: true});
      }
    }
    eSendEvent(eCloseProgressDialog, 'note_history');
    eSendEvent(eCloseProgressDialog);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes
    ]);

    ToastEvent.show({
      heading: 'Note restored successfully',
      type: 'success'
    });
  }

  return (
    <View
      style={{
        height:session.locked ? null : 600,
        width: '100%'
      }}>
      <DialogHeader padding={12} title={session.session} />
      {!session.locked ? (
        <WebView
          ref={webviewRef}
          onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
          onLoad={onLoad}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
          cacheMode="LOAD_DEFAULT"
          domStorageEnabled={true}
          scrollEnabled={true}
          bounces={false}
          allowFileAccess={true}
          scalesPageToFit={true}
          allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          cacheEnabled={true}
          source={{
            uri: sourceUri + 'plaineditor.html'
          }}
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: 100,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Paragraph
          color={colors.icon}
          >Preview not available, content is encrypted.</Paragraph>
        </View>
      )}

      <View
        style={{
          paddingHorizontal: 12
        }}>
        <Button
          onPress={restore}
          title="Restore this version"
          type="accent"
          width="100%"
        />
      </View>
    </View>
  );
}
