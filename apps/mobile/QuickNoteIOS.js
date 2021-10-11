import React, {Component, createRef} from 'react';
import {
  ActivityIndicator,
  Appearance,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';
import ShareExtension from 'rn-extensions-share';
import NotesnookShare from './share';
import {COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT} from './src/utils/Colors';
import {db} from './src/utils/database';
import Storage from './src/utils/storage';
import {sleep} from './src/utils/TimeUtils';

let validator;
let linkPreview;
export default class QuickNoteIOS extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isOpen: true,
      text: '',
      title: '',
      loading: false,
      loadingIntent: false,
      colors:
        Appearance.getColorScheme() === 'dark'
          ? COLOR_SCHEME_DARK
          : COLOR_SCHEME_LIGHT,
      height: 0
    };
    this.initialText = '';
    this.textInputRef = createRef();
    this.titleInputRef = createRef();
  }

  componentDidMount() {
    SplashScreen.hide();
    sleep(300).then(r => {
      this.textInputRef.current?.focus();
    });
  }

  close = () => {
    ShareExtension.openURL('ShareMedia://MainApp');
  };

  onPress = async () => {
    this.titleInputRef.current?.blur();
    this.textInputRef.current?.blur();
    this.setState({
      loading: true
    });

    let tag = `<p>${this.state.text}</p>`;

    let add = async () => {
      await db.notes.add({
        title: this.state.title,
        content: {
          type: 'tiny',
          data: tag
        },
        id: null
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

  saveBtn = () => (
    <View
      style={{
        paddingHorizontal: 12
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
          flexDirection: 'row'
        }}>
        {this.state.loading && (
          <ActivityIndicator color={this.state.colors.light} />
        )}

        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: this.state.colors.light,
            marginLeft: this.state.loading ? 10 : 0
          }}>
          Save Note
        </Text>
      </TouchableOpacity>
    </View>
  );

  render() {
    return (
      <SafeAreaView
        style={{
          width: '100%',
          height: '100%',
          justifyContent: 'flex-start',
          backgroundColor: this.state.colors.nav
        }}>
        <NotesnookShare quicknote={true} />
      </SafeAreaView>
    );
  }
}
