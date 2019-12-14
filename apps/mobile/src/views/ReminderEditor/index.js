import React, {useEffect, useState, createRef, useCallback} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  FlatList,
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

export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  return update;
}

const ReminderEditor = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  const _textRender = createRef();

  return (
    <SafeAreaView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: '5%',
          marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.04,
          marginBottom: h * 0.04,
        }}>
        <Text
          style={{
            fontSize: SIZE.xl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
            paddingVertical: 0,
            paddingHorizontal: 0,
            maxWidth: '90%',
            width: '90%',
          }}>
          Set a Reminder
        </Text>
        <Icon name="md-more" color={colors.icon} size={SIZE.xl} />
      </View>

      <Text
        style={{
          width: '90%',
          alignSelf: 'center',
          fontFamily: WEIGHT.semibold,
          color: colors.pri,
          fontSize: SIZE.sm,
          marginBottom: 10,
        }}>
        What do you want to be reminded about?
      </Text>

      <TextInput
        ref={_textRender}
        style={{
          width: '90%',
          maxWidth: '90%',
          textAlignVertical: 'top',
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
          marginHorizontal: '5%',
          paddingVertical: pv - 5,
          borderRadius: 5,
          paddingHorizontal: ph - 5,
          backgroundColor: colors.navbg,
          marginBottom: 15,
        }}
        maxLength={80}
        placeholder="eg. Sara's Birthday"
        placeholderTextColor={colors.icon}
        onChangeText={value => {
          _text = value;
        }}
      />

      <TextInput
        ref={_textRender}
        style={{
          width: '90%',
          maxWidth: '90%',
          textAlignVertical: 'top',
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
          marginHorizontal: '5%',
          paddingVertical: pv - 5,
          borderRadius: 5,
          paddingHorizontal: ph - 5,
          backgroundColor: colors.navbg,
          marginBottom: 10,
        }}
        numberOfLines={3}
        maxLength={80}
        multiline={true}
        placeholder="You can add a short note here"
        placeholderTextColor={colors.icon}
        onChangeText={value => {
          _text = value;
        }}
      />
    </SafeAreaView>
  );
};

ReminderEditor.navigationOptions = {
  header: null,
};

export default ReminderEditor;
