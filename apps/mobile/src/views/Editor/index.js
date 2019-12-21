import React, {useEffect, useState} from 'react';
import {
  View,
  Platform,
  Linking,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Dimensions,
  TextInput,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import WebView from 'react-native-webview';
import Icon from 'react-native-vector-icons/Feather';

import {db} from '../../../App';
import {SideMenuEvent} from '../../utils/utils';
import {Dialog} from '../../components/Dialog';
import {DDS} from '../../../App';
import * as Animatable from 'react-native-animatable';
import SideMenu from 'react-native-side-menu';
import {EditorMenu} from '../../components/EditorMenu';
import {AnimatedSafeAreaView} from '../Home';
import {useAppContext} from '../../provider/useAppContext';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

var timestamp = null;
var content = null;
var title = null;
let titleRef;
let EditorWebView;

const Editor = ({navigation}) => {
  // Global State
  const {colors} = useAppContext();

  // Local State

  const [dialog, setDialog] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [sidebar, setSidebar] = useState(DDS.isTab ? true : false);
  const [noteProps, setNoteProps] = useState({
    tags: [],
    locked: false,
    pinned: false,
    favorite: false,
    colors: [],
  });
  // VARIABLES
  let updateInterval = null;

  // FUNCTIONS

  const post = value => EditorWebView.postMessage(value);

  const onChange = data => {
    if (data !== '') {
      content = JSON.parse(data);
    }
  };

  const saveNote = async (noteProps = {}) => {
    if (!content) {
      content = {
        text: '',
        delta: null,
      };
    }

    timestamp = await db.addNote({
      tags: noteProps.tags,
      colors: noteProps.colors,
      pinned: noteProps.pinned,
      favorite: noteProps.favorite,
      locked: noteProps.locked,
      title,
      content,
      dateCreated: timestamp,
    });
  };

  const onWebViewLoad = () => {
    post(JSON.stringify(colors));
    if (navigation.state.params && navigation.state.params.note) {
      let note = navigation.state.params.note;
      titleRef.setNativeProps({
        text: note.title,
      });
      title = note.title;

      timestamp = note.dateCreated;
      post(JSON.stringify(note.content.delta));
      let props = {
        tags: note.tags,
        colors: note.colors,
        pinned: note.pinned,
        favorite: note.favorite,
        locked: note.locked,
      };
      setNoteProps({...props});
      console.log(note);
    }

    if (content && content.delta) {
      post(JSON.stringify(content.delta));
    }
  };
  const onTitleTextChange = value => {
    title = value;
  };

  const _renderEditor = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{height: '100%'}}>
        <View
          style={{
            height: '100%',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '96%',
              alignSelf: 'center',
              marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.04,
            }}>
            <TouchableOpacity
              onPress={() => {
                setDialog(true);
              }}
              style={{
                width: 40,
                height: 40,
              }}>
              <Icon
                style={{
                  paddingRight: 10,
                  marginTop: 3.5,
                }}
                name="chevron-left"
                color={colors.icon}
                size={SIZE.xl}
              />
            </TouchableOpacity>

            <TextInput
              placeholder="Untitled Note"
              ref={ref => (titleRef = ref)}
              placeholderTextColor={colors.icon}
              defaultValue={title}
              style={{
                width: '80%',
                fontFamily: WEIGHT.bold,
                fontSize: SIZE.xl,
                color: colors.pri,
                maxWidth: '80%',
                paddingVertical: 0,
              }}
              onChangeText={onTitleTextChange}
              onSubmitEditing={saveNote}
            />

            <TouchableOpacity
              onPress={() => {
                DDS.isTab ? setSidebar(!sidebar) : setOpen(!isOpen);
              }}
              style={{
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 3,
              }}>
              <Icon
                name={sidebar || isOpen ? 'x' : 'menu'}
                color={colors.icon}
                size={SIZE.xl}
              />
            </TouchableOpacity>
          </View>

          <WebView
            ref={ref => (EditorWebView = ref)}
            onError={error => console.log(error)}
            onLoad={onWebViewLoad}
            javaScriptEnabled
            onShouldStartLoadWithRequest={request => {
              if (request.url.includes('https')) {
                Linking.openURL(request.url);
                return false;
              } else {
                return true;
              }
            }}
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
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            domStorageEnabled
            scrollEnabled={false}
            bounces={true}
            scalesPageToFit={true}
            source={
              Platform.OS === 'ios'
                ? require('./web/texteditor.html')
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
            onMessage={evt => {
              if (evt.nativeEvent.data !== '') {
                onChange(evt.nativeEvent.data);
              }
            }}
          />
        </View>
      </KeyboardAvoidingView>
    );
  };

  // EFFECTS

  useEffect(() => {
    let handleBack = BackHandler.addEventListener('hardwareBackPress', () => {
      setDialog(true);
      return true;
    });
    return () => {
      title = null;
      timestamp = null;
      content = null;
      handleBack.remove();
      handleBack = null;
    };
  }, []);

  useEffect(() => {
    updateInterval = setInterval(async function() {
      await saveNote(noteProps);
    }, 2000);
    return () => {
      saveNote(noteProps);
      clearInterval(updateInterval);
      updateInterval = null;
    };
  }, [noteProps]);

  useEffect(() => {
    return () => {
      DDS.isTab ? SideMenuEvent.open() : null;
      SideMenuEvent.enable();
    };
  });

  useEffect(() => {
    EditorWebView.reload();
  }, [colors]);

  return DDS.isTab ? (
    <View
      style={{
        flexDirection: 'row',
        width: '100%',
      }}>
      <AnimatedSafeAreaView
        transition={['backgroundColor', 'width']}
        duration={300}
        style={{
          height: '100%',
          backgroundColor: colors.bg,
          width: sidebar ? '70%' : '100%',
        }}>
        <Dialog
          title="Close Editor"
          visible={dialog}
          icon="x"
          paragraph="Are you sure you want to close editor?"
          close={() => {
            setDialog(false);
          }}
          positivePress={() => {
            navigation.goBack();
            setDialog(false);
          }}
        />
        {_renderEditor()}
      </AnimatedSafeAreaView>
      <Animatable.View
        transition={['width', 'opacity']}
        duration={300}
        style={{
          width: sidebar ? '30%' : '0%',
          opacity: sidebar ? 1 : 0,
        }}>
        <EditorMenu />
      </Animatable.View>
    </View>
  ) : (
    <SideMenu
      isOpen={isOpen}
      bounceBackOnOverdraw={false}
      contentContainerStyle={{
        opacity: 0,
      }}
      openMenuOffset={w / 1.2}
      menuPosition="right"
      onChange={args => {
        setTimeout(() => {
          setOpen(args);
        }, 500);
      }}
      menu={
        <EditorMenu
          hide={false}
          noteProps={noteProps}
          updateProps={props => {
            setNoteProps(props);

            console.log(props, noteProps);
          }}
          close={() => {
            setTimeout(() => {
              setOpen(args);
            }, 500);
          }}
        />
      }>
      <AnimatedSafeAreaView
        transition="backgroundColor"
        duration={300}
        style={{height: '100%', backgroundColor: colors.bg}}>
        <Dialog
          title="Close Editor"
          visible={dialog}
          icon="x"
          paragraph="Are you sure you want to close editor?"
          close={() => {
            setDialog(false);
          }}
          positivePress={() => {
            navigation.goBack();
            setDialog(false);
          }}
        />
        {_renderEditor()}
      </AnimatedSafeAreaView>
    </SideMenu>
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
