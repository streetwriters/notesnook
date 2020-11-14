import React from 'react';
import {ActivityIndicator, StyleSheet, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {PressableButton} from '../PressableButton';
import {ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';

const BUTTON_TYPES = {
  transparent: {
    primary: 'transparent',
    text: 'accent',
    selected: 'shade',
  },
  gray: {
    primary: 'transparent',
    text: 'icon',
    selected: 'nav',
  },
  accent: {
    primary: 'accent',
    text: 'white',
    selected: 'accent',
  },
  inverted: {
    primary: 'bg',
    text: 'accent',
    selected: 'bg',
  },
};

export const Button = ({
  height = 40,
  width = null,
  onPress = () => {},
  loading = false,
  title = '',
  icon,
  fontSize = SIZE.sm,
  type = 'transparent',
}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <PressableButton
      onPress={onPress}
      disabled={loading}
      color={colors[BUTTON_TYPES[type].primary]}
      selectedColor={colors[BUTTON_TYPES[type].selected]}
      alpha={!colors.night ? -0.04 : 0.04}
      customStyle={{
        height: height,
        width: width || null,
        paddingVertical: pv,
        paddingHorizontal: ph,
        borderRadius: 5,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
      }}>
      {loading && <ActivityIndicator color={colors[BUTTON_TYPES[type].text]} />}
      {icon && !loading && (
        <Icon
          name={icon}
          style={{
            marginRight: 0,
          }}
          color={colors[BUTTON_TYPES[type].text]}
          size={SIZE.md}
        />
      )}
      <Text
        style={[
          styles.buttonText,
          {color: colors[BUTTON_TYPES[type].text], fontSize: fontSize},
        ]}>
        {title}
      </Text>
    </PressableButton>
  );
};

const styles = StyleSheet.create({
  activityText: {
    fontSize: SIZE.sm,
    textAlign: 'center',
  },
  activityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: WEIGHT.bold,
    color: 'white',
    fontSize: SIZE.md,
    marginLeft: 5,
  },
});
