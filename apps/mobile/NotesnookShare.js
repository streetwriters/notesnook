import React, {Component, createRef, useEffect, useRef, useState} from 'react';
import {Keyboard} from 'react-native';
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
import {SIZE} from './src/utils/SizeUtils';
import Storage from './src/utils/storage';
import {sleep} from './src/utils/TimeUtils';
import absolutify from 'absolutify';
import {Dimensions} from 'react-native';
import validator from 'validator';
import linkPreview from 'link-preview-js';
import ShareExtension from 'rn-extensions-share';

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

const ShareApp = () => {
  const [colors, setColors] = useState(
    Appearance.getColorScheme() === 'dark'
      ? COLOR_SCHEME_DARK
      : COLOR_SCHEME_LIGHT,
  );
  const [note, setNote] = useState({
    title: null,
    id: null,
    content: {
      type: 'tiny',
      data: null,
    },
  });
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [height, setHeight] = useState(0);
  const [floating, setFloating] = useState(false);
  const [rawData, setRawData] = useState({
    type: null,
    value: null,
  });
  const textInputRef = useRef();
  const titleInputRef = useRef();

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
    let _note = {...note};
    _note.title = 'Web link share';
    _note.content.data = !note.content.data
      ? makeHtmlFromUrl(link)
      : note.content.data + '\n' + makeHtmlFromUrl(link);
    try {
      let preview = await linkPreview.getLinkPreview(link);
      note.title = preview.siteName || preview.title;
    } catch (e) {}
    setNote(_note);
  };

  const loadData = async () => {
    const data = await ShareExtension.data();
    for (item of data) {
      if (item.type === 'text') {
        if (validator.isURL(item.value)) {
          await showLinkPreview(item.value);
        } else {
          setNote(note => {
            note.title = 'Web link share';
            note.content.data = note.content.data
              ? note.content.data + '\n' + makeHtmlFromPlainText(item.value)
              : makeHtmlFromPlainText(item.value);
          });
        }
      }
    }
  };
};




export default class NotesnookShare extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isOpen: true,
      text: '',
      title: '',
      loading: false,
      loadingIntent: true,
      colors:
        Appearance.getColorScheme() === 'dark'
          ? COLOR_SCHEME_DARK
          : COLOR_SCHEME_LIGHT,
      height: 0,
      floating: false,
    };
    this.initialText = '';
    this.textInputRef = createRef();
    this.titleInputRef = createRef();
  }

  async componentDidMount() {
    Keyboard.addListener(
      'keyboardWillChangeFrame',
      this.onKeyboardWillChangeFrame,
    );
    try {
      const data = await ShareExtension.data();
      let text;
      let item = data[0];
      if (item.type === 'text') {
        text = item.value;
      }
      if (validator.isURL(text)) {
        linkPreview
          .getLinkPreview(text)
          .then(r => {
            if (r?.siteName) {
              this.setState({
                title: r.siteName,
                text: text,
                loadingIntent: false,
              });
            } else if (r?.title) {
              this.setState({
                title: r.title,
                text: text,
                loadingIntent: false,
              });
            } else {
              this.setState({
                title: 'Web Link',
                text: text,
                loadingIntent: false,
              });
            }
          })
          .catch(e => {
            this.setState({
              title: 'Web Link',
              text: text,
              loadingIntent: false,
            });
          });
      } else {
        this.setState({
          text: text,
          loadingIntent: false,
        });
      }

      this.initialText = text;
    } catch (e) {
      console.log('errrr', e);
    }
  }

  componentWillUnmount() {
    Keyboard.removeListener(
      'keyboardWillChangeFrame',
      this.onKeyboardWillChangeFrame,
    );
  }

  close = () => {
    this.setState({
      text: null,
    });
    ShareExtension.close();
  };

  onPress = async () => {
    this.titleInputRef.current?.blur();
    this.textInputRef.current?.blur();
    this.setState({
      loading: true,
    });

    let tag = validator.isURL(this.initialText)
      ? `<a href='${this.initialText}' target='_blank'>${
          this.state.text.split(' ')[0]
        }</a>
      <p>${
        this.state.text.split(' ').length > 0
          ? this.state.text.split(' ').slice(1).join(' ')
          : ''
      } </p>`
      : `<p>${this.state.text}</p>`;

    let add = async () => {
      await db.notes.add({
        title: this.state.title,
        content: {
          type: 'tiny',
          data: tag,
        },
        id: null,
      });
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

  onKeyboardWillChangeFrame = event => {
    this.setState({floating: event.endCoordinates.width !== windowWidth});
  };

  render() {
    return (
      <View
        style={{
          width:
            Dimensions.get('window').width > 500
              ? 500
              : Dimensions.get('window').width,
          height: Dimensions.get('window').height,
          justifyContent: 'flex-end',
        }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            ShareExtension.close();
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
          enabled={!this.state.floating && Platform.OS === 'ios'}
          style={{
            paddingVertical: 25,
            backgroundColor: this.state.colors.bg,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
          }}
          behavior="padding">
          {this.state.loadingIntent ? (
            <View
              style={{
                height: 150,
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ActivityIndicator color={this.state.colors.accent} />

              <Text
                style={{
                  color: this.state.colors.pri,
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
                    borderBottomColor: this.state.colors.nav,
                    paddingHorizontal: 12,
                    justifyContent: 'space-between',
                  }}>
                  <TextInput
                    ref={this.titleInputRef}
                    style={{
                      fontSize: 25,
                      fontWeight: 'bold',
                      color: this.state.colors.pri,
                      flexGrow: 1,
                      maxWidth: '85%',
                    }}
                    placeholderTextColor={this.state.colors.icon}
                    value={this.state.title}
                    onChangeText={v => this.setState({title: v})}
                    onSubmitEditing={() => {
                      this.textInputRef.current?.focus();
                    }}
                    blurOnSubmit={false}
                    placeholder="Note title"
                  />

                  <TouchableOpacity
                    onPress={this.close}
                    activeOpacity={0.8}
                    style={{
                      width: 50,
                      height: 40,
                      borderRadius: 5,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: this.state.colors.accent,
                        marginLeft: this.state.loading ? 10 : 0,
                      }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  ref={this.textInputRef}
                  style={{
                    fontSize: 15,
                    color: this.state.colors.pri,
                    marginBottom: 10,
                    width: '100%',
                    maxHeight: '70%',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                  }}
                  placeholderTextColor={this.state.colors.icon}
                  onChangeText={v => this.setState({text: v})}
                  multiline={true}
                  value={this.state.text}
                  blurOnSubmit={false}
                  placeholder="Type your note here"
                />
                <View
                  style={{
                    paddingHorizontal: 12,
                  }}>
                  <TouchableOpacity
                    onPress={this.onPress}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: this.state.colors.accent,
                      width: '100%',
                      height: 50,
                      borderRadius: 5,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                    }}>
                    {this.state.loading && (
                      <ActivityIndicator color={this.state.colors.light} />
                    )}

                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: this.state.colors.light,
                        marginLeft: this.state.loading ? 10 : 0,
                      }}>
                      Save Note
                    </Text>
                  </TouchableOpacity>
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
  }
}
