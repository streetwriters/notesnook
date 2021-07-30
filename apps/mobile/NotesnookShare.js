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
import {COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {SIZE} from './src/utils/SizeUtils';
import Storage from './src/utils/storage';
import {sleep} from './src/utils/TimeUtils';

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

  const animate = (opacityV, translateV) => {
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

  useEffect(() => {
    Keyboard.addListener('keyboardWillChangeFrame', onKeyboardWillChangeFrame);
    return () => {
      Keyboard.removeListener(
        'keyboardWillChangeFrame',
        onKeyboardWillChangeFrame
      );
    };
  });

  const onKeyboardWillChangeFrame = event => {
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
    sleep(300).then(() => {
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
            backgroundColor: 'rgba(0,0,0,0.01)'
          }}
        />
      </TouchableOpacity>

      <AnimatedKAV
        enabled={!floating && Platform.OS === 'ios'}
        style={{
          paddingVertical: 25,
          backgroundColor: colors.bg,
          borderTopRightRadius: 10,
          borderTopLeftRadius: 10,
          marginBottom: insets.top,
          transform: [
            {
              translateY: Platform.OS !== 'ios' ? translate : 0
            }
          ]
        }}
        behavior="padding">
          <View
          style={{
            width:50,
            height:6,
            borderRadius:100,
            backgroundColor:colors.nav,
            alignSelf:'center',
            position:'absolute',
            marginTop:15
          }}
          />
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
                    validator.isURL(rawData.value)
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
                          fontFamily:null
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

              <TextInput
                ref={textInputRef}
                style={{
                  fontSize: 15,
                  color: colors.pri,
                  marginBottom: 10,
                  width: '100%',
                  maxHeight: '70%',
                  padding: 12,
                  backgroundColor: colors.nav,
                  alignSelf: 'center',
                  marginTop: 10,
                  minHeight: 80,
                  paddingTop: 12,
                  paddingBottom: 12
                }}
                placeholderTextColor={colors.icon}
                onChangeText={v => (editorContentValue = v)}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                value={editorContentValue}
                blurOnSubmit={false}
                placeholder="Add some additional notes here"
              />

              <View
                style={{
                  paddingHorizontal: 12,
                }}>

                <Button
                  title={loading ? 'Saving note' : 'Save note'}
                  color={colors.accent}
                  onPress={onPress}
                  loading={loading}
                  style={{
                    width: '100%'
                  }}
                />
              </View>
              <View
                style={{
                  height: 10
                }}
              />
            </View>
          </>
        )}
      </AnimatedKAV>
    </AnimatedSAV>
  );
};

const Button = ({title, onPress, color, loading, style, textStyle}) => {
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
        style
      ]}>
      {loading && <ActivityIndicator color="white" />}

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
    </TouchableOpacity>
  );
};

export default NotesnookShare;
