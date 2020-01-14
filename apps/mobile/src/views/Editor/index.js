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
import SideMenu from 'react-native-side-menu';
import {EditorMenu} from '../../components/EditorMenu';
import {AnimatedSafeAreaView} from '../Home';
import {useAppContext} from '../../provider/useAppContext';
import ActionSheet from '../../components/ActionSheet';
import {ActionSheetComponent} from '../../components/ActionSheetComponent';
import {VaultDialog} from '../../components/VaultDialog';
import NavigationService from '../../services/NavigationService';
import {useIsFocused} from 'react-navigation-hooks';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

var timestamp = null;
var content = null;
var title = null;
let titleRef;
let EditorWebView;
let timer = null;
let note = {};

const Editor = ({navigation}) => {
  // Global State
  const {colors} = useAppContext();

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
    setTimeout(() => {
      title = note.title;
      titleRef.setNativeProps({
        text: title,
      });
      timestamp = note.dateCreated;
      content = note.content;
    }, 200);
  };

  const onTitleTextChange = value => {
    title = value;
  };

  const onMenuHide = () => {
    if (show) {
      if (show === 'lock') {
        if (unlock) {
          setUnlock(false);
        }
        setVaultDialog(true);
      } else if (show === 'unlock') {
        setUnlock(true);
        setVaultDialog(true);
      } else if (show == 'delete') {
        setVisible(true);
      }
    }
  };

  const deleteItem = async () => {
    await db.deleteNotes([note]);
    ToastEvent.show('Note moved to trash', 'success', 3000);
    setVisible(false);
    navigation.goBack();
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
                setDialog(true);
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
                  : actionSheet._setModalVisible();
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
      setDialog(true);
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

  if (!isFocused) {
    console.log('block rerender');
    return <></>;
  } else {
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
              setTimeout(() => {
                navigation.goBack();
                setDialog(false);
              }, 1000);
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

        <Dialog
          visible={visible}
          title="Delete note"
          icon="trash"
          paragraph="Do you want to delete this note?"
          positiveText="Delete"
          positivePress={deleteItem}
          close={() => {
            setVisible(false);
          }}
        />

        <VaultDialog
          close={(item, locked) => {
            let props = {...noteProps};
            props.locked = locked;
            note.locked = locked;
            setNoteProps(props);
            setVaultDialog(false);
            setUnlock(false);
          }}
          note={note}
          timestamp={timestamp}
          perm={true}
          openedToUnlock={unlock}
          visible={vaultDialog}
        />
        <ActionSheet
          ref={ref => (actionSheet = ref)}
          customStyles={{
            backgroundColor: colors.bg,
          }}
          initialOffsetFromBottom={0.99}
          elevation={5}
          overlayColor={
            colors.night ? 'rgba(225,225,225,0.1)' : 'rgba(0,0,0,0.3)'
          }
          indicatorColor={colors.shade}
          onClose={() => {
            onMenuHide();
            if (willRefresh) {
              note = db.getNote(timestamp);

              updateEditor();
            }
          }}
          children={
            <ActionSheetComponent
              item={note}
              setWillRefresh={value => {
                cutsomNote = value;
                willRefresh = true;
              }}
              hasColors={true}
              hasTags={true}
              rowItems={['Add to', 'Share', 'Export', 'Delete']}
              columnItems={['Dark Mode', 'Add to Vault', 'Pin', 'Favorite']}
              close={value => {
                if (value) {
                  show = value;
                }

                actionSheet._setModalVisible();
              }}
            />
          }
        />
      </Animatable.View>
    );
  }
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
