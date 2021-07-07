import absolutify from 'absolutify';
import {getLinkPreview} from 'link-preview-js';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Appearance,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
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

async function sanitizeHtml(site) {
  try {
    let html = await fetch(site);
    html = await html.text();
    let siteHtml = sanitize(html, {
      allowedTags: sanitize.defaults.allowedTags.concat([
        'img',
        'style',
        'head',
        'link',
      ]),
      allowedClasses: true,
      allowVulnerableTags: true,
      allowedAttributes: false,
      allowProtocolRelative: true,
      allowedSchemes: false,
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
    data: null,
  },
};

let editorContentValue = null;

const NotesnookShare = () => {
  const [colors, setColors] = useState(
    Appearance.getColorScheme() === 'dark'
      ? COLOR_SCHEME_DARK
      : COLOR_SCHEME_LIGHT,
  );
  const [note, setNote] = useState(defaultNote);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [floating, setFloating] = useState(false);
  const [rawData, setRawData] = useState({
    type: null,
    value: null,
  });
  const textInputRef = useRef();
  const titleInputRef = useRef();
  const {width, height} = useWindowDimensions();
  const webviewRef = useRef();
  const opacity = useValue(0);
  const translate = useValue(1000);

  const animate = (opacityV, translateV) => {
    timing(opacity, {
      toValue: opacityV,
      duration: 300,
      easing: Easing.in(Easing.ease),
    }).start();
    timing(translate, {
      toValue: translateV,
      duration: 300,
      easing: Easing.in(Easing.ease),
    }).start();
  };

  useEffect(() => {
    Keyboard.addListener('keyboardWillChangeFrame', onKeyboardWillChangeFrame);
    return () => {
      Keyboard.removeListener(
        'keyboardWillChangeFrame',
        onKeyboardWillChangeFrame,
      );
    };
  });

  const onKeyboardWillChangeFrame = event => {
    setFloating(event.endCoordinates.width !== windowWidth);
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
      console.log(data.length);
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
    setNote(defaultNote);
    setLoadingIntent(true);
    animate(0, 1000);
    await sleep(300);
    ShareExtension.close();
  };

  const params = 'platform=' + Platform.OS;
  const sourceUri =
    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
    'Web.bundle/loader.html';
  const injectedJS = `if (!window.location.search) {
         var link = document.getElementById('progress-bar');
          link.href = './site/plaineditor.html?${params}';
          link.click();  
    }`;

  const onLoad = () => {
    console.log('loading', note.content.data);
    postMessage(webviewRef, 'htmldiff', note.content?.data);
    let theme = {...colors};
    theme.factor = 1;
    postMessage(webviewRef, 'theme', JSON.stringify(theme));
  };

  function postMessage(webview, type, value = null) {
    let message = {
      type: type,
      value,
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
    close();
  };

  return (
    <Animated.View
      style={{
        width: width > 500 ? 500 : width,
        height: height,
        justifyContent: 'flex-end',
        opacity: Platform.OS !== 'ios' ? opacity : 1,
      }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          close();
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.01)',
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
          transform: [
            {
              translateY: Platform.OS !== 'ios' ? translate : 0,
            },
          ],
        }}
        behavior="padding">
        {loadingIntent ? (
          <View
            style={{
              height: 150,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ActivityIndicator color={colors.accent} />

            <Text
              style={{
                color: colors.pri,
                fontSize: SIZE.md,
                marginTop: 5,
              }}>
              Parsing Data...
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                maxHeight: '100%',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.nav,
                  paddingHorizontal: 12,
                  justifyContent: 'space-between',
                }}>
                <TextInput
                  ref={titleInputRef}
                  style={{
                    fontSize: 25,
                    fontWeight: 'bold',
                    color: colors.pri,
                    flexGrow: 1,
                    maxWidth: '100%',
                  }}
                  placeholderTextColor={colors.icon}
                  value={note?.title}
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
                  height: height * 0.25,
                  width: '100%',
                }}>
                <WebView
                  onLoad={onLoad}
                  ref={webviewRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                  }}
                  injectedJavaScript={Platform.OS === 'ios' ? injectedJS : null}
                  onShouldStartLoadWithRequest={() => {
                    return false;
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
                          baseUrl: 'file:///android_asset/',
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
                  width: '95%',
                  maxHeight: '70%',
                  padding: 12,
                  backgroundColor: colors.nav,
                  alignSelf: 'center',
                  borderRadius: 5,
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
                  flexDirection: 'row',
                  justifyContent: validator.isURL(rawData.value)
                    ? 'space-between'
                    : 'flex-end',
                }}>
                <Button
                  style={{
                    width: null,
                    paddingHorizontal: 10,
                    backgroundColor: colors.nav,
                    marginRight: 10,
                  }}
                  textStyle={{
                    color: colors.icon,
                  }}
                  title="Cancel"
                  onPress={close}
                />
                {validator.isURL(rawData.value) && (
                  <Button
                    title="Clip Webpage"
                    color={colors.accent}
                    style={{
                      marginRight: 10,
                    }}
                    onPress={async () => {
                      let html = await sanitizeHtml(rawData.value);
                      console.log(html);
                      setNote(note => {
                        note.content.data = html;
                        return note;
                      });
                      onLoad();
                    }}
                  />
                )}

                <Button
                  title={loading ? 'Saving note' : 'Save note'}
                  color={colors.accent}
                  onPress={onPress}
                  loading={loading}
                />
              </View>
              <View
                style={{
                  height: 25,
                }}
              />
            </View>
          </>
        )}
      </AnimatedKAV>
    </Animated.View>
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
          minWidth: 100,
          paddingHorizontal: 20,
        },
        style,
      ]}>
      {loading && <ActivityIndicator color="white" />}

      <Text
        style={[
          {
            fontSize: 15,
            fontWeight: 'bold',
            color: 'white',
            marginLeft: loading ? 10 : 0,
          },
          textStyle,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default NotesnookShare;
