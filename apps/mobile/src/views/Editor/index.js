import React, {useEffect, useState, createRef} from 'react';
import {
  View,
  SafeAreaView,
  Keyboard,
  LayoutAnimation,
  Platform,
  Linking,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Dimensions,
  TextInput,
} from 'react-native';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';
import WebView from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import {useForceUpdate} from '../ListsEditor';
import {NavigationEvents} from 'react-navigation';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;
const saveText = (type, title, content) => {
  let data = {
    type,
    title,
    headline: content.slice(0, 60),
    timestamp: Date.now(),
  };
};

const Editor = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  let EditorWebView = createRef();
  const _textRender = createRef();
  let _heading = '';
  let _text = '';
  let keyboardDidShowListener;
  let keyboardDidHideListener;

  const _keyboardDidShow = e => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setKeyboardHeight(e.endCoordinates.height);
  };

  const post = value => EditorWebView.current.postMessage(value);

  const _keyboardDidHide = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setKeyboardHeight(0);
  };

  function onChangeText(data) {
    if (data !== '') {
      let m = JSON.parse(data);
      console.log(m);
    }
  }

  useEffect(() => {
    DeviceEventEmitter.emit('hide');
    keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      _keyboardDidShow,
    );
    keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      _keyboardDidHide,
    );
    return () => {
      DeviceEventEmitter.emit('show');
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  });

  const _renderWebpage = () => {
    return Platform.OS === 'ios' ? (
      <KeyboardAvoidingView behavior="padding" style={{height: '100%'}}>
        <View
          style={{
            height: '100%',
          }}>
          <TextInput
            placeholder="Untitled Note"
            placeholderTextColor={colors.icon}
            style={{
              width: '100%',
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.xxl,
              paddingHorizontal: '3%',
              paddingVertical: 0,
              marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.04,
            }}
          />

          <WebView
            ref={EditorWebView}
            onError={error => console.log(error)}
            javaScriptEnabled
            onShouldStartLoadWithRequest={request => {
              if (request.url.includes('https')) {
                Linking.openURL(request.url);
                return false;
              } else {
                return true;
              }
            }}
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            domStorageEnabled
            scrollEnabled={false}
            bounces={true}
            scalesPageToFit={true}
            source={require('./web/texteditor.html')}
            style={{height: '100%', maxHeight: '100%'}}
            onMessage={evt => {
              if (evt.nativeEvent.data !== '') {
                onChangeText(evt.nativeEvent.data);
              }
            }}
          />
        </View>
      </KeyboardAvoidingView>
    ) : (
      <View
        style={{
          height: '100%',
        }}>
        <TextInput
          placeholder="Untitled Note"
          placeholderTextColor={colors.icon}
          style={{
            width: '100%',
            fontFamily: WEIGHT.bold,
            fontSize: SIZE.xxl,
            paddingHorizontal: '3%',
            paddingVertical: 0,
            marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.04,
          }}
        />

        <WebView
          ref={EditorWebView}
          onError={error => console.log(error)}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          onShouldStartLoadWithRequest={request => {
            if (request.url.includes('https')) {
              Linking.openURL(request.url);
              return false;
            } else {
              return true;
            }
          }}
          scrollEnabled={false}
          bounces
          scalesPageToFit
          source={{
            uri: 'file:///android_asset/texteditor.html',
            baseUrl: 'baseUrl:"file:///android_asset/',
          }}
          style={{height: '100%', maxHeight: '100%'}}
          onMessage={evt => {
            if (evt.nativeEvent.data !== '') {
              onChangeText(evt.nativeEvent.data);
            }
          }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={{height: '100%'}}>
      {_renderWebpage()}
      <NavigationEvents
        onWillFocus={() => {
          DeviceEventEmitter.emit('hide');
        }}
      />
    </SafeAreaView>
  );
};

Editor.navigationOptions = {
  header: null,
};

export default Editor;
