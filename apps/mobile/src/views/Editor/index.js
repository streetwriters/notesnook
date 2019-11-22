import React, {useEffect, useState, createRef} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
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
import Icon from 'react-native-vector-icons/Ionicons';
import RichText from 'react-native-rich-text';
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
  let _heading = '';
  let _text = '';
  const _textRender = createRef();

  return (
    <SafeAreaView
      style={{
        height: '100%',
      }}>
      <View
        style={{
          width: '100%',
          paddingHorizontal: '5%',
          paddingVertical: pv,

          alignSelf: 'center',
          marginTop: 25,
        }}>
        <Icon name="ios-arrow-back" size={SIZE.xl} color="black" />
      </View>

      <RichText value="">
        <RichText.Editor onChangeText={text => console.log(text)} />
      </RichText>
    </SafeAreaView>
  );
};

Editor.navigationOptions = {
  header: null,
};

export default Editor;
