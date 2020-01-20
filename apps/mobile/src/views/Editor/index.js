import React, {useEffect, useState} from 'react';
import {
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import WebView from 'react-native-webview';
import {db, DDS} from '../../../App';
import {SIZE} from '../../common/common';
import {
  ActionSheetEvent,
  simpleDialogEvent,
  TEMPLATE_EXIT,
} from '../../components/DialogManager';
import {EditorMenu} from '../../components/EditorMenu';
import {useTracked, ACTIONS} from '../../provider';
import {SideMenuEvent} from '../../utils/utils';
import {AnimatedSafeAreaView} from '../Home';

let EditorWebView;
let note = {};
var timestamp = null;
var content = null;
var title = null;
let timer = null;
const Editor = ({navigation}) => {
  // Global State
  const [state, dispatch] = useTracked();
  const {colors} = state;

  // Local State
  const [sidebar, setSidebar] = useState(DDS.isTab ? true : false);

  // FUNCTIONS

  const post = value => EditorWebView.postMessage(value);

  const onChange = data => {
    if (data !== '') {
      let rawData = JSON.parse(data);
      if (rawData.type === 'content') {
        content = rawData;
      } else {
        title = rawData.value;
      }
    }
  };

  const _onMessage = evt => {
    if (evt.nativeEvent.data !== '') {
      clearTimeout(timer);
      timer = null;
      onChange(evt.nativeEvent.data);
      timer = setTimeout(() => {
        saveNote(true);
      }, 1000);
    }
  };

  const _onShouldStartLoadWithRequest = request => {
    if (request.url.includes('https')) {
      Linking.openURL(request.url);
      return false;
    } else {
      return true;
    }
  };

  const saveNote = async (noteProps = {}, lockNote = true) => {
    if (!content) {
      content = {
        text: '',
        delta: null,
      };
    }

    timestamp = await db.addNote({
      title,
      content: {
        text: content.text,
        delta: content.delta,
      },
      dateCreated: timestamp,
    });

    if (lockNote && db.getNote(timestamp).locked) {
      db.lockNote(timestamp, 'password');
    }
  };

  const onWebViewLoad = () => {
    post(JSON.stringify(colors));
    if (navigation.state.params && navigation.state.params.note) {
      note = navigation.state.params.note;
      updateEditor();
    }
  };

  const updateEditor = () => {
    post(JSON.stringify(note.content.delta));
    post(
      JSON.stringify({
        type: 'title',
        value: note.title,
      }),
    );
    title = note.title;
    timestamp = note.dateCreated;
    content = note.content;
  };

  const params = 'platform=' + Platform.OS;
  const sourceUri =
    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
    'Web.bundle/loader.html';
  const injectedJS = `if (!window.location.search) {
      var link = document.getElementById('progress-bar');
      link.href = './site/index.html?${params}';
      link.click();
    }`;

  const _renderEditor = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{
          height: '100%',
        }}>
        <View
          style={{
            marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
          }}
        />
        <TouchableOpacity
          onPress={() => {
            simpleDialogEvent(TEMPLATE_EXIT('Editor'));
          }}
          style={{
            width: '12.5%',
            height: 50,
            justifyContent: 'center',
            alignItems: 'flex-start',
            position: 'absolute',
            left: 0,
            top: 0,
            marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
            paddingLeft: 12,
            zIndex: 999,
          }}>
          <Icon
            style={{
              marginLeft: -7,
            }}
            name="chevron-left"
            color={colors.icon}
            size={SIZE.xxxl - 3}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            DDS.isTab
              ? setSidebar(!sidebar)
              : ActionSheetEvent(
                  note,
                  true,
                  true,
                  ['Add to', 'Share', 'Export', 'Delete'],
                  ['Dark Mode', 'Add to Vault', 'Pin', 'Favorite'],
                );
          }}
          style={{
            width: '12.5%',
            height: 50,
            justifyContent: 'center',
            alignItems: 'flex-end',
            position: 'absolute',
            right: 0,
            top: 0,
            marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
            paddingRight: 12,
            zIndex: 999,
          }}>
          <Icon name="more-horizontal" color={colors.icon} size={SIZE.xxxl} />
        </TouchableOpacity>

        <WebView
          ref={ref => (EditorWebView = ref)}
          onError={error => console.log(error)}
          onLoad={onWebViewLoad}
          javaScriptEnabled
          onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
          renderLoading={() => (
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
              }}
            />
          )}
          cacheEnabled={true}
          domStorageEnabled
          scrollEnabled={false}
          bounces={true}
          allowFileAccess={true}
          scalesPageToFit={true}
          originWhitelist={'*'}
          injectedJavaScript={Platform.OS === 'ios' ? injectedJS : null}
          source={
            Platform.OS === 'ios'
              ? {uri: sourceUri}
              : {
                  uri: 'file:///android_asset/texteditor.html',
                  baseUrl: 'baseUrl:"file:///android_asset/',
                }
          }
          style={{
            height: '100%',
            maxHeight: '100%',
            backgroundColor: 'transparent',
          }}
          onMessage={_onMessage}
        />
      </KeyboardAvoidingView>
    );
  };

  // EFFECTS

  useEffect(() => {
    let handleBack = BackHandler.addEventListener('hardwareBackPress', () => {
      simpleDialogEvent(TEMPLATE_EXIT('Editor'));

      return true;
    });
    return () => {
      handleBack.remove();
      handleBack = null;
      title = null;
      content = null;
      timer = null;
      timestamp = null;
    };
  }, []);

  useEffect(() => {
    SideMenuEvent.disable();
    return () => {
      DDS.isTab ? SideMenuEvent.open() : null;
      SideMenuEvent.enable();
    };
  });

  useEffect(() => {
    EditorWebView.reload();
  }, [colors]);

  return (
    <AnimatedSafeAreaView
      transition={['backgroundColor', 'width']}
      duration={300}
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        height: '100%',
        width: sidebar ? '70%' : '100%',
      }}>
      {_renderEditor()}
      <Animatable.View
        transition={['width', 'opacity']}
        duration={300}
        style={{
          width: sidebar ? '30%' : '0%',
          opacity: sidebar ? 1 : 0,
        }}>
        {DDS.isTab ? <EditorMenu hide={false} /> : null}
      </Animatable.View>
    </AnimatedSafeAreaView>
  );
};

Editor.navigationOptions = {
  header: null,
  headerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 0,
  },
};

export default Editor;
