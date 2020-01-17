import React, {useState} from 'react';
import {Dimensions, Platform, SafeAreaView, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLOR_SCHEME, SIZE, WEIGHT} from '../../common/common';
import {Reminder} from '../../components/Reminder';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Reminders = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <SafeAreaView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: '5%',
          marginTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.04,
          marginBottom: h * 0.04,
        }}>
        <Text
          style={{
            fontSize: SIZE.xl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
          }}>
          Reminders
        </Text>
        <Icon name="md-more" color={colors.icon} size={SIZE.xl} />
      </View>

      <Reminder invert={true} />
    </SafeAreaView>
  );
};

Reminders.navigationOptions = {
  header: null,
};

export default Reminders;
