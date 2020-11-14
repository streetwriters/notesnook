import React from 'react';
import {ActivityIndicator, StyleSheet, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {PressableButton} from '../PressableButton';
import {ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';

export const Button = ({
  height = 40,
  width = '48%',
  onPress = () => {},
  loading = false,
  grayed,
  title = '',
  icon,
  color,
  fontSize = SIZE.sm,
  iconColor = 'accent',
}) => {
  const [state] = useTracked();
  const {colors} = state;
  const usedColor =  colors[color];

  return (
    <PressableButton
      onPress={onPress}
      color={usedColor || "transparent"}
      selectedColor={grayed ? colors.nav : colors.shade}
      alpha={grayed ? (!colors.night ? -0.02 : 0.02) : -0.1}
      customStyle={{
        height: height,
        width: width ? width : null,
        paddingVertical: pv,
        paddingHorizontal: ph,
        borderRadius: 5,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
      }}>
      {loading ? <ActivityIndicator color={usedColor} /> : null}
      {icon && !loading ? (
        <Icon
          name={icon}
          style={{
            marginRight: 0,
          }}
          color={grayed ? colors.icon : colors[iconColor]}
          size={SIZE.md}
        />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          {color: grayed ? colors.icon : colors[iconColor], fontSize: fontSize},
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
