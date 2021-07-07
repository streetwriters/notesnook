import React, {Component, createRef, useEffect, useRef, useState} from 'react';
import {Keyboard, useWindowDimensions} from 'react-native';
import {
  ActivityIndicator,
  Appearance,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
} from 'react-native';
import sanitize from 'sanitize-html';
import {COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT} from './src/utils/Colors';
import {db} from './src/utils/DB';
import {normalize, SIZE} from './src/utils/SizeUtils';
import Storage from './src/utils/storage';
import {sleep} from './src/utils/TimeUtils';
import absolutify from 'absolutify';
import {Dimensions} from 'react-native';
import validator from 'validator';
import {getLinkPreview} from 'link-preview-js';
import ShareExtension from 'rn-extensions-share';
import WebView from 'react-native-webview';
import {
  injectedJS,
  sourceUri,
  _onShouldStartLoadWithRequest,
} from './src/views/Editor/Functions';

async function sanitizeHtml(site) {
  try {
    let html = await fetch(site);
    html = await html.text();
    let siteHtml = sanitize(html, {
      allowedTags: [
        'address',
        'article',
        'aside',
        'footer',
        'header',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hgroup',
        'main',
        'nav',
        'section',
        'blockquote',
        'dd',
        'div',
        'dl',
        'dt',
        'figcaption',
        'figure',
        'hr',
        'li',
        'main',
        'ol',
        'p',
        'pre',
        'ul',
        'a',
        'abbr',
        'b',
        'bdi',
        'bdo',
        'br',
        'cite',
        'code',
        'data',
        'dfn',
        'em',
        'i',
        'kbd',
        'mark',
        'q',
        'rb',
        'rp',
        'rt',
        'rtc',
        'ruby',
        's',
        'samp',
        'small',
        'span',
        'strong',
        'sub',
        'sup',
        'time',
        'u',
        'var',
        'wbr',
        'caption',
        'col',
        'colgroup',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'tr',
        'img',
      ],
    });
    return absolutify(siteHtml, site);
  } catch (e) {
    return '';
  }
}

function makeHtmlFromUrl(url) {
  return `<a href='${url}' target='_blank'>${url}</a>`;
}

function makeHtmlFromPlainText(text) {
  return `<p>${text}</p>`;
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
      setNote(note => {
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
  }, []);

  const close = () => {
    setNote(defaultNote);
    setLoadingIntent(true);
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
      _note.content.data = _note.content.data + `<p>${editorContentValue}</p>`;
      await db.notes.add(note);
    };
    if (db && db.notes) {
      await add();
    } else {
      await db.init();
      await add();
    }
    await Storage.write('notesAddedFromIntent', 'added');
    await sleep(500);
    this.close();
  };

  return (
    <View
      style={{
        width: width > 500 ? 500 : width,
        height: height,
        justifyContent: 'flex-end',
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

      <KeyboardAvoidingView
        enabled={!floating && Platform.OS === 'ios'}
        style={{
          paddingVertical: 25,
          backgroundColor: colors.bg,
          borderTopRightRadius: 10,
          borderTopLeftRadius: 10,
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
                  width: '100%',
                  maxHeight: '70%',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                }}
                placeholderTextColor={colors.icon}
                onChangeText={v => (editorContentValue = v)}
                multiline={true}
                value={editorContentValue}
                blurOnSubmit={false}
                placeholder="Add some notes here"
              />
              <View
                style={{
                  paddingHorizontal: 12,
                }}>
                {validator.isURL(rawData.value) && (
                  <Button
                    title="Clip Webpage"
                    color={colors.accent}
                    onPress={async () => {
                      let html = await sanitizeHtml(rawData.value);
                      console.log(html);
                      setNote(note => {
                        note.content.data = html;
                        return note;
                      });
                      onLoad();
                    }}
                    loading={loading}
                  />
                )}

                <Button
                  title="Save note"
                  color={colors.accent}
                  onPress={() => {}}
                  loading={loading}
                />

                <Button
                  style={{
                    width: null,
                    paddingHorizontal: 10,
                    backgroundColor: colors.nav,
                  }}
                  title="Cancel"
                  onPress={close}
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
      </KeyboardAvoidingView>
    </View>
  );
};

const Button = ({title, onPress, color, loading, style}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: color,
          width: '100%',
          height: 50,
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 10,
        },
        style,
      ]}>
      {loading && <ActivityIndicator color="white" />}

      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: 'white',
          marginLeft: loading ? 10 : 0,
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default NotesnookShare;
