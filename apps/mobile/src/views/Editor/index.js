import React, {useEffect, useState, createRef} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
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
    <SafeAreaView>
      <View
        style={{
          width: '100%',
          paddingHorizontal: '5%',
          paddingVertical: pv + 5,
          borderBottomWidth: 1,
          borderBottomColor: colors.navbg,
          alignSelf: 'center',
        }}>
        <Icon name="ios-arrow-back" size={SIZE.xl} color="black" />
      </View>

      <TextInput
        style={{
          width: '100%',
          maxWidth: '100%',
          textAlignVertical: 'top',
          fontSize: SIZE.xl,
          fontFamily: WEIGHT.semibold,
          paddingHorizontal: '5%',
          paddingVertical: ph,
        }}
        allowFontScaling={true}
        adjustsFontSizeToFit={true}
        maxLength={50}
        numberOfLines={1}
        placeholderTextColor={colors.icon}
        placeholder="Untitled Note"
        onChangeText={value => {
          _heading = value;
        }}
      />

      <TextInput
        ref={_textRender}
        style={{
          width: '100%',
          maxWidth: '100%',
          textAlignVertical: 'top',
          fontSize: SIZE.md,
          fontFamily: WEIGHT.semibold,
          paddingHorizontal: '5%',
          paddingVertical: ph,
        }}
        multiline={true}
        placeholder="Start writing"
        placeholderTextColor={colors.icon}
        onChangeText={value => {
          _text = value;
        }}
      />
    </SafeAreaView>
  );
};

Editor.navigationOptions = {
  header: null,
};

export default Editor;
