import React, {useEffect, useState} from 'react';
import {
  View,
  Platform,
  Linking,
  KeyboardAvoidingView,
  Dimensions,
  TextInput,
  BackHandler,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import WebView from 'react-native-webview';
import Icon from 'react-native-vector-icons/Feather';
import {db} from '../../../App';
import {SideMenuEvent, getElevation, ToastEvent} from '../../utils/utils';
import {Dialog} from '../../components/Dialog';
import {DDS} from '../../../App';
import * as Animatable from 'react-native-animatable';
import {EditorMenu} from '../../components/EditorMenu';
import {AnimatedSafeAreaView} from '../Home';
import {useAppContext} from '../../provider/useAppContext';
import ActionSheet from '../../components/ActionSheet';
import {ActionSheetComponent} from '../../components/ActionSheetComponent';
import {VaultDialog} from '../../components/VaultDialog';
import {useIsFocused} from 'react-navigation-hooks';
import {useTracked} from '../../provider';
import {
  simpleDialogEvent,
  TEMPLATE_EXIT,
  ActionSheetEvent,
} from '../../components/DialogManager';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

let titleRef;
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

  ///
  const updateDB = () => {};

  // Local State

  const [dialog, setDialog] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [sidebar, setSidebar] = useState(DDS.isTab ? true : false);
  const [vaultDialog, setVaultDialog] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [visible, setVisible] = useState(false);
  const [noteProps, setNoteProps] = useState({
    tags: [],
    locked: false,
    pinned: false,
    favorite: false,
    colors: [],
  });

  // VARIABLES

  let willRefresh = false;
  let customNote = null;
  let actionSheet;
  let show;
  const isFocused = useIsFocused();
  // FUNCTIONS

  const post = value => EditorWebView.postMessage(value);

  const onChange = data => {
    if (data !== '') {
      content = JSON.parse(data);
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
      ...noteProps,
      title,
      content: {
        text: content.text,
        delta: content.delta,
      },
      dateCreated: timestamp,
    });
    updateDB();
    if (lockNote && noteProps.locked) {
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
    let props = {
      tags: note.tags,
      colors: note.colors,
      pinned: note.pinned,
      favorite: note.favorite,
      locked: note.locked,
    };
    setNoteProps({...props});

    post(JSON.stringify(note.content.delta));

    title = note.title;
    titleRef.setNativeProps({
      text: title,
    });
    timestamp = note.dateCreated;
    content = note.content;
  };

  const onTitleTextChange = value => {
    title = value;
    clearTimeout(timer);
    timer = null;
    timer = setTimeout(() => {
      saveNote(noteProps, true);
    }, 1000);
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
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingHorizontal: 12,
              width: '100%',
              alignSelf: 'center',
              height: 50,

              marginTop: Platform.OS == 'ios' ? 0 : StatusBar.currentHeight,
            }}>
            <TouchableOpacity
              onPress={() => {
                simpleDialogEvent(TEMPLATE_EXIT('Editor'));
              }}
              style={{
                width: '12.5%',
                height: 40,
                justifyContent: 'center',
                alignItems: 'flex-start',
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

            <TextInput
              placeholder="Untitled Note"
              ref={ref => (titleRef = ref)}
              placeholderTextColor={colors.icon}
              defaultValue={note && note.title ? note.title : title}
              style={{
                width: '75%',
                fontFamily: WEIGHT.bold,
                fontSize: SIZE.xl,
                color: colors.pri,
                maxWidth: '75%',
                paddingVertical: 0,
                paddingHorizontal: 0,
              }}
              onChangeText={onTitleTextChange}
              onSubmitEditing={saveNote}
            />

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
                height: 40,
                justifyContent: 'center',
                alignItems: 'flex-end',
              }}>
              <Icon
                name="more-horizontal"
                color={colors.icon}
                size={SIZE.xxxl}
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
                clearTimeout(timer);
                timer = null;
                onChange(evt.nativeEvent.data);
                timer = setTimeout(() => {
                  saveNote(noteProps, true);
                  console.log('saved');
                }, 1000);
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
        {_renderEditor()}
      </AnimatedSafeAreaView>
      <Animatable.View
        transition={['width', 'opacity']}
        duration={300}
        style={{
          width: sidebar ? '30%' : '0%',
          opacity: sidebar ? 1 : 0,
        }}>
        <EditorMenu
          hide={false}
          noteProps={noteProps}
          updateProps={props => {
            setNoteProps(props);
          }}
          close={() => {
            setTimeout(() => {
              setOpen(args);
            }, 500);
          }}
        />
      </Animatable.View>
    </View>
  ) : (
    <Animatable.View
      transition="backgroundColor"
      duration={300}
      style={{
        backgroundColor: colors.bg,
        flex: 1,
      }}>
      <AnimatedSafeAreaView
        transition="backgroundColor"
        duration={300}
        style={{height: '100%', backgroundColor: colors.bg}}>
        {_renderEditor()}
      </AnimatedSafeAreaView>
    </Animatable.View>
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
