import absolutify from 'absolutify';
import {getLinkPreview} from 'link-preview-js';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Appearance,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Animated, {Easing, timing, useValue} from 'react-native-reanimated';
import WebView from 'react-native-webview';
import ShareExtension from 'rn-extensions-share';
import sanitize from 'sanitize-html';
import validator from 'validator';
import {getElevation, showTooltip, TOOLTIP_POSITIONS} from '../src/utils';
import {COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT} from '../src/utils/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import {db} from '../src/utils/database';
import {SIZE} from '../src/utils/SizeUtils';
import Storage from '../src/utils/storage';
import {sleep} from '../src/utils/TimeUtils';

const AnimatedKAV = Animated.createAnimatedComponent(KeyboardAvoidingView);
const AnimatedSAV = Animated.createAnimatedComponent(SafeAreaView);
async function sanitizeHtml(site) {
  try {
    let html = await fetch(site);
    html = await html.text();
    let siteHtml = sanitize(html, {
      allowedTags: sanitize.defaults.allowedTags.concat([
        'img',
        'style',
        'head',
        'link'
      ]),
      allowedClasses: true,
      allowVulnerableTags: true,
      allowedAttributes: false,
      allowProtocolRelative: true,
      allowedSchemes: false
    });
    return absolutify(siteHtml, site);
  } catch (e) {
    return '';
  }
}

function makeHtmlFromUrl(url) {
  return `<a style="overflow-wrap:anywhere;white-space:pre-wrap" href='${url}' target='_blank'>${url}</a>`;
}

function makeHtmlFromPlainText(text) {
  if (!text) return '';
  return `<p style="overflow-wrap:anywhere;white-space:pre-wrap" >${text}</p>`;
}

let defaultNote = {
  title: null,
  id: null,
  content: {
    type: 'tiny',
    data: null
  }
};

let editorContentValue = null;

const modes = {
  1: {
    type: 'text',
    title: 'Plain text',
    icon: 'card-text-outline'
  },
  2: {
    type: 'clip',
    title: 'Web clip',
    icon: 'web'
  },
  3: {
    type: 'link',
    title: 'Link',
    icon: 'link'
  }
};

const NotesnookShare = () => {
  const [colors, setColors] = useState(
    Appearance.getColorScheme() === 'dark'
      ? COLOR_SCHEME_DARK
      : COLOR_SCHEME_LIGHT
  );
  const [note, setNote] = useState(defaultNote);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [floating, setFloating] = useState(false);
  const [quickNote, setQuickNote] = useState(false);
  const [rawData, setRawData] = useState({
    type: null,
    value: null
  });
  const textInputRef = useRef();
  const titleInputRef = useRef();
  const {width, height} = useWindowDimensions();
  const webviewRef = useRef();
  const opacity = useValue(0);
  const translate = useValue(1000);
  const insets = {
    top: Platform.OS === 'ios' ? 30 : 0
  };
  const prevAnimation = useRef(null);
  const [mode, setMode] = useState(1);
  const [keyboard,setKeyboard] = useState(false);

  const animate = (opacityV, translateV) => {
    prevAnimation.current = translateV;
    if (Platform.OS === 'ios') return;
    timing(opacity, {
      toValue: opacityV,
      duration: 300,
      easing: Easing.in(Easing.ease)
    }).start();
    timing(translate, {
      toValue: translateV,
      duration: 300,
      easing: Easing.in(Easing.ease)
    }).start();
  };

  const onKeyboardDidShow = (event) => {
    let kHeight = event.endCoordinates.height;
    console.log('called')
    translate.setValue(-kHeight/1.8);
  }

  const onKeyboardDidHide = () => {
    translate.setValue(0);
  }

  useEffect(() => {
    let keyboardWillChangeFrame = Keyboard.addListener('keyboardWillChangeFrame', onKeyboardWillChangeFrame);
    let keyboardDidShow = Keyboard.addListener("keyboardDidShow", onKeyboardDidShow);
    let keyboardDidHide = Keyboard.addListener("keyboardDidHide", onKeyboardDidHide);
    return () => {
      keyboardWillChangeFrame?.remove();
      keyboardDidShow?.remove();
      keyboardDidHide?.remove();
    };
  },[]);

  const onKeyboardWillChangeFrame = event => {
    console.log('keyboad change frame',event)
    setFloating(event.endCoordinates.width !== width);
  };

  const showLinkPreview = async link => {
    let _note = {...defaultNote};
    _note.title = 'Web link share';
    _note.content.data = !note.content.data
      ? makeHtmlFromUrl(link)
      : note.content.data + '\n' + makeHtmlFromUrl(link);
    try {
      let preview = await getLinkPreview(link);
      _note.title = preview.siteName || preview.title;
    } catch (e) {
      console.log(e);
    }
    setNote(_note);
  };

  const loadData = async () => {
    try {
      setNote(() => {
        defaultNote.content.data = null;
        return defaultNote;
      });
      const data = await ShareExtension.data();
      console.log(data);
      if (!data || data.length === 0) {
        setRawData({
          value: ''
        });
        setLoadingIntent(false);
        setQuickNote(true);
        return;
      }
      for (item of data) {
        if (item.type === 'text') {
          setRawData(item);
          if (validator.isURL(item.value)) {
            await showLinkPreview(item.value);
          } else {
            setNote(note => {
              note.title = 'Note Share';
              note.content.data = note.content.data
                ? note.content.data + '\n' + makeHtmlFromPlainText(item.value)
                : makeHtmlFromPlainText(item.value);

              return note;
            });
          }
        }
      }
    } catch (e) {}
    setLoadingIntent(false);
  };

  useEffect(() => {
    setNote(defaultNote);
    loadData();
    sleep(50).then(() => {
      animate(1, 0);
    });
  }, []);

  const close = async () => {
    animate(0, 1000);
    await sleep(300);
    setNote(defaultNote);
    setLoadingIntent(true);
    ShareExtension.close();
  };

  const onLoad = () => {
    postMessage(webviewRef, 'htmldiff', note.content?.data);
    let theme = {...colors};
    theme.factor = 1;
    postMessage(webviewRef, 'theme', JSON.stringify(theme));
  };

  function postMessage(webview, type, value = null) {
    let message = {
      type: type,
      value
    };
    webview.current?.postMessage(JSON.stringify(message));
  }

  const onPress = async () => {
    titleInputRef.current?.blur();
    textInputRef.current?.blur();
    setLoading(true);

    let add = async () => {
      let _note = {...note};
      _note.content.data =
        _note.content.data + makeHtmlFromPlainText(editorContentValue);
      await db.notes.add(note);
    };
    if (db && db.notes) {
      await add();
    } else {
      await db.init();
      await add();
    }
    await Storage.write('notesAddedFromIntent', 'added');
    setLoading(false);
    await sleep(300);
    close();
  };

  const sourceUri = 'Plain.bundle/site/plaineditor.html';

  const onShouldStartLoadWithRequest = request => {
    if (request.url.includes('/site/plaineditor.html')) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <AnimatedSAV
      style={{
        width: width > 500 ? 500 : width,
        height: height,
        justifyContent: 'flex-end',
        opacity: Platform.OS !== 'ios' ? opacity : 1
      }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          close();
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute'
        }}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0)'
          }}
        />
      </TouchableOpacity>

      <AnimatedKAV
        enabled={!floating && Platform.OS === 'ios'}
        onLayout={event => {
          if (prevAnimation.current === 0) return;
          console.log('setting value here');
          translate.setValue(event.nativeEvent.layout.height + 30);
        }}
        style={{
          paddingVertical: 25,
          backgroundColor: 'transparent',
          marginBottom: insets.top,
          transform: [
            {
              translateY: Platform.OS !== 'ios' ? translate : 0
            }
          ]
        }}
        behavior="padding">
        {quickNote ? null : (
          <View
            style={{
              width: 50,
              height: 6,
              borderRadius: 100,
              backgroundColor: colors.nav,
              alignSelf: 'center',
              position: 'absolute',
              marginTop: 15
            }}
          />
        )}

        {loadingIntent ? (
          <View
            style={{
              height: 150,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <ActivityIndicator color={colors.accent} />

            <Text
              style={{
                color: colors.pri,
                fontSize: SIZE.md,
                marginTop: 5
              }}>
              Parsing Data...
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                maxHeight: '100%'
              }}>
              {quickNote ? null : (
                <View
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.nav,
                    paddingHorizontal: 12
                  }}>
                  <TextInput
                    ref={titleInputRef}
                    style={{
                      fontSize: 25,
                      fontFamily:
                        Platform.OS === 'android' ? 'Roboto-Medium' : null,
                      fontWeight: Platform.OS === 'ios' ? '600' : null,
                      color: colors.pri,
                      flexGrow: 1,
                      maxWidth: '100%'
                    }}
                    placeholderTextColor={colors.icon}
                    defaultValue={note?.title}
                    onChangeText={v =>
                      setNote(_note => {
                        _note.title = v;
                        return _note;
                      })
                    }
                    onSubmitEditing={() => {
                      textInputRef.current?.focus();
                    }}
                    blurOnSubmit={false}
                    placeholder="Note title"
                  />
                </View>
              )}

              {quickNote ? null : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.nav
                  }}>
                  {[
                    {
                      title: 'Plain text',
                      onPress: () => {
                        let html = validator.isURL(rawData.value)
                          ? makeHtmlFromUrl(rawData.value)
                          : makeHtmlFromPlainText(rawData.value);
                        setNote(note => {
                          note.content.data = html;
                          return note;
                        });
                        onLoad();
                      }
                    },
                    ...[
                      rawData?.value && validator.isURL(rawData.value)
                        ? {
                            title: 'Clip webpage',
                            onPress: async () => {
                              let html = await sanitizeHtml(rawData.value);
                              setNote(note => {
                                note.content.data = html;
                                return note;
                              });
                              onLoad();
                            }
                          }
                        : null
                    ]
                  ].map(
                    (item, index) =>
                      item && (
                        <Button
                          title={item.title}
                          color={colors.nav}
                          textStyle={{
                            color: colors.icon,
                            fontWeight: 'normal',
                            fontSize: 14,
                            fontFamily: null
                          }}
                          onPress={item.onPress}
                          style={{
                            borderWidth: 0.5,
                            borderRadius: 100,
                            borderColor: colors.icon,
                            height: 30,
                            marginRight: 10,
                            marginLeft: index === 0 ? 12 : 0,
                            paddingHorizontal: 12
                          }}
                        />
                      )
                  )}
                </View>
              )}

              {quickNote ? null : (
                <View
                  style={{
                    height: height * 0.25,
                    width: '100%'
                  }}>
                  <WebView
                    onLoad={onLoad}
                    ref={webviewRef}
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
                    allowingReadAccessToURL={
                      Platform.OS === 'android' ? true : null
                    }
                    onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    cacheEnabled={true}
                    source={
                      Platform.OS === 'ios'
                        ? {uri: sourceUri}
                        : {
                            uri: 'file:///android_asset/plaineditor.html',
                            baseUrl: 'file:///android_asset/'
                          }
                    }
                  />
                </View>
              )}

              <View
                style={{
                  width: '100%',
                  paddingHorizontal: 12
                }}>
                <Button
                  color={colors.accent}
                  onPress={onPress}
                  loading={loading}
                  icon="check"
                  iconSize={25}
                  type="action"
                  style={{
                    position: 'absolute',
                    zIndex: 999,
                    ...getElevation(10),
                    right: 24,
                    bottom: -35
                  }}
                />

                <View
                  style={{
                    marginTop: 10,
                    minHeight: 100,
                    borderRadius: 10,
                    ...getElevation(5),
                    backgroundColor: colors.bg
                  }}>
                  <TextInput
                    ref={textInputRef}
                    style={{
                      fontSize: 16,
                      color: colors.pri,
                      fontFamily: 'OpenSans-Regular',
                      padding: 12,
                      width: '100%'
                    }}
                    placeholderTextColor={colors.icon}
                    onChangeText={v => (editorContentValue = v)}
                    multiline={true}
                    numberOfLines={quickNote ? 5 : 3}
                    textAlignVertical="top"
                    value={editorContentValue}
                    blurOnSubmit={false}
                    placeholder={
                      quickNote
                        ? 'Write something...'
                        : 'Add some additional notes here'
                    }
                  />

                  <View
                    style={{
                      flexDirection: 'row',
                      paddingHorizontal: 12,
                      paddingRight: 80
                    }}>
                    <Button
                      color={colors.shade}
                      onPress={onPress}
                      loading={loading}
                      icon={modes[mode].icon}
                      onPress={async () => {
                        let _mode = modes[mode];
                        if (_mode.type === "text") {
                          setMode(2);
                          return;
                        }
                        if (_mode.type === "clip") {
                          setMode(1);
                          return
                        }

                        if (_mode.type == "link") {
                          setMode(3)
                        }
                      }}
                      title={modes[mode].title}
                      iconSize={18}
                      iconColor={colors.accent}
                      textStyle={{
                        fontSize: 12,
                        color: colors.accent,
                        marginLeft: 5
                      }}
                      style={{
                        marginRight: 10,
                        height: 30,
                        borderRadius: 100,
                        paddingHorizontal: 12,
                        marginTop: -2.5
                      }}
                    />

                    {Clipboard.hasString() ? (
                      <Button
                        color={colors.nav}
                        onPress={onPress}
                        loading={loading}
                        icon="clipboard"
                        onPress={async () => {
                          let text = await Clipboard.getString();
                          if (text) {
                            textInputRef.current?.setNativeProps({
                              text: text
                            });
                            editorContentValue = text;
                          }
                        }}
                        iconSize={18}
                        iconColor={colors.icon}
                        title="Paste"
                        textStyle={{
                          fontSize: 12,
                          color: colors.icon,
                          marginLeft: 5
                        }}
                        style={{
                          marginRight: 15,
                          height: 30,
                          borderRadius: 100,
                          paddingHorizontal: 6,
                          marginTop: -2.5
                        }}
                      />
                    ) : null}
                  </View>
                </View>
              </View>
              <View
                style={{
                  height: 40
                }}
              />
            </View>
          </>
        )}
      </AnimatedKAV>
    </AnimatedSAV>
  );
};

const Button = ({
  title,
  onPress,
  color,
  loading,
  style,
  textStyle,
  icon,
  iconSize = 1,
  type = 'button',
  iconColor
}) => {
  const types = {
    action: {
      width: 60,
      height: 60,
      borderRadius: 100,
      minWidth: 0,
      paddingHorizontal: 0
    },
    button: {
      backgroundColor: color,
      height: 50,
      borderRadius: 5,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 10,
      minWidth: 80,
      paddingHorizontal: 20
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: color,
          height: 50,
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 10,
          minWidth: 80,
          paddingHorizontal: 20
        },
        types[type],
        style
      ]}>
      {loading && <ActivityIndicator color="white" />}

      {icon && (
        <Icon name={icon} size={iconSize} color={iconColor || 'white'} />
      )}

      {title && (
        <Text
          style={[
            {
              fontSize: 18,
              fontFamily: Platform.OS === 'android' ? 'Roboto-Medium' : null,
              fontWeight: Platform.OS === 'ios' ? '600' : null,
              color: 'white',
              marginLeft: loading ? 10 : 0
            },
            textStyle
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default NotesnookShare;
