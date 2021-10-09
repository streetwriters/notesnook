import Clipboard from '@react-native-clipboard/clipboard';
import absolutify from 'absolutify';
import { getLinkPreview } from 'link-preview-js';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Appearance,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Animated, { Easing, timing, useValue } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import ShareExtension from 'rn-extensions-share';
import validator from 'validator';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../src/services/EventManager';
import { getElevation } from '../src/utils';
import { COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT } from '../src/utils/Colors';
import { db } from '../src/utils/database';
import Storage from '../src/utils/storage';
import { sleep } from '../src/utils/TimeUtils';

const AnimatedKAV = Animated.createAnimatedComponent(KeyboardAvoidingView);
const AnimatedSAV = Animated.createAnimatedComponent(SafeAreaView);
async function sanitizeHtml(site) {
  try {
    let html = await fetch(site);
    html = await html.text();
    let siteHtml = html.replace(
      /(?:<(script|button|input|textarea|style|link)(?:\s[^>]*)?>)\s*((?:(?!<\1)[\s\S])*)\s*(?:<\/\1>)/g,
      ''
    );
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

function getBaseUrl(site) {
  var url = site.split('/').slice(0, 3).join('/');
  return url;
}

async function absolutifyImgs(html, site) {
  let parser = global.HTMLParser;
  global.HTMLParser.body.innerHTML = html;

  let images = parser.querySelectorAll('img');
  for (var i = 0; i < images.length; i++) {
    let img = images[i];
    let url = getBaseUrl(site);
    if (!img.src.startsWith('http')) {
      if (img.src.startsWith('//')) {
        img.src = img.src.replace('//', 'https://');
      } else {
        img.src = url + img.src;
      }
    }
  }
  return parser.body.innerHTML;
}

let defaultNote = {
  title: null,
  id: null,
  content: {
    type: 'tiny',
    data: null
  }
};


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
  const [rawData, setRawData] = useState({
    type: null,
    value: null
  });
  const {width, height} = useWindowDimensions();
  const webviewRef = useRef();
  const opacity = useValue(0);
  const translate = useValue(1000);
  const insets = {
    top: Platform.OS === 'ios' ? 30 : 0
  };
  const prevAnimation = useRef(null);
  const [mode, setMode] = useState(1);

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

  const onKeyboardDidShow = event => {
    let kHeight = event.endCoordinates.height;
    //translate.setValue(-150);
  };

  const onKeyboardDidHide = () => {
    translate.setValue(0);
  };

  useEffect(() => {
    let keyboardWillChangeFrame = Keyboard.addListener(
      'keyboardWillChangeFrame',
      onKeyboardWillChangeFrame
    );
    let keyboardDidShow = Keyboard.addListener(
      'keyboardDidShow',
      onKeyboardDidShow
    );
    let keyboardDidHide = Keyboard.addListener(
      'keyboardDidHide',
      onKeyboardDidHide
    );
    return () => {
      keyboardWillChangeFrame?.remove();
      keyboardDidShow?.remove();
      keyboardDidHide?.remove();
    };
  }, []);

  const onKeyboardWillChangeFrame = event => {
    setFloating(event.endCoordinates.width !== width);
  };

  const showLinkPreview = async (note, link) => {
    let _note = note;
    _note.content.data = makeHtmlFromUrl(link);
    try {
      let preview = await getLinkPreview(link);
      _note.title = preview.siteName || preview.title;
    } catch (e) {
      console.log(e);
    }
    return note;
  };

  const loadData = async () => {
    try {
      const data = await ShareExtension.data();
      if (!data || data.length === 0) {
        setRawData({
          value: ''
        });
        setNote({...defaultNote});
        setLoadingIntent(false);
        return;
      }
      let note = defaultNote;
      for (item of data) {
        if (item.type === 'text') {
          setRawData(item);
          if (validator.isURL(item.value)) {
            note = await showLinkPreview(note, item.value);
          } else {
            note.content.data = makeHtmlFromPlainText(item.value);
          }
        }
      }
      setNote({...note});
    } catch (e) {}
    setLoadingIntent(false);
  };

  useEffect(() => {
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
    content = await getContent();
    if (!content || content === '') {
      return;
    }
    setLoading(true);
    let add = async () => {
      let _note = {
        ...note,
        content: {
          data: content,
          type: 'tiny'
        }
      };
      await db.notes.add(_note);
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

  const getContent = () => {
    return new Promise(resolve => {
      let oncontent = value => {
        eUnSubscribeEvent('share_content_event', oncontent);
        resolve(value);
      };
      eSubscribeEvent('share_content_event', oncontent);
      webviewRef.current?.injectJavaScript(`(function() {
        let html = document.querySelector(".htmldiff_div").innerHTML;
        if (!html) {
          html = '';
        }
        reactNativeEventHandler('tiny', html);
      })();`);
    });
  };

  const onMessage = event => {
    if (!event) return;
    let data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'tiny') {
      eSendEvent('share_content_event', data.value);
    }
  };

  useEffect(() => {
    onLoad();
  }, [note]);

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
        <View
          style={{
            maxHeight: '100%',
            paddingHorizontal: 12
          }}>
          <View
            style={{
              width: '100%'
            }}>
            <Button
              color={colors.accent}
              onPress={onPress}
              loading={loading || loadingIntent}
              icon="check"
              iconSize={25}
              type="action"
              loading={loading}
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
              <View
                style={{
                  width: '100%',
                  height: height * 0.25,
                  paddingBottom: 15
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
                  onMessage={onMessage}
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

              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 12,
                  paddingRight: 80,
                  alignItems: 'center'
                }}>
                <Button
                  color={colors.shade}
                  onPress={onPress}
                  icon={modes[mode].icon}
                  onPress={async () => {
                    let _mode = modes[mode];
                    if (
                      _mode.type === 'text' &&
                      validator.isURL(rawData.value)
                    ) {
                      let html = await sanitizeHtml(rawData.value);
                      html = await absolutifyImgs(html, rawData.value);

                      setNote(note => {
                        note.content.data = html;
                        return {...note};
                      });
                      setMode(2);
                      return;
                    }

                    if (_mode.type === 'clip') {
                      let html = validator.isURL(rawData.value)
                        ? makeHtmlFromUrl(rawData.value)
                        : makeHtmlFromPlainText(rawData.value);
                      setNote(note => {
                        note.content.data = html;
                        return {...note};
                      });
                      setMode(1);
                      return;
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
                    icon="clipboard"
                    onPress={async () => {
                      let text = await Clipboard.getString();
                      if (text) {
                        let content = await getContent();
                        setNote(note => {
                          note.content.data =
                            content + '\n' + makeHtmlFromPlainText(text);
                          return {...note};
                        });
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

      {icon && !loading && (
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
