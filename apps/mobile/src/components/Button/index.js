import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { PressableButton } from '../PressableButton';
import {ph, pv, SIZE, WEIGHT} from "../../utils/SizeUtils";

export const Button = ({
  height = 40,
  width = '48%',
  onPress = () => {},
  loading = false,
  grayed,
  title = '',
  icon,
  color = 'accent',
  fontSize=SIZE.sm
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const usedColor = 'accent' ? colors.accent : color;

  return (
    <PressableButton
      onPress={onPress}
      color={grayed ? colors.nav : usedColor}
      selectedColor={grayed ? colors.nav : usedColor}
      alpha={grayed ? (!colors.night ? -0.04 : 0.04) : -0.1}
      customStyle={{
        height: height,
        width: width? width : null,
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
            marginRight: 5,
          }}
          color={grayed ? colors.icon : 'white'}
          size={SIZE.lg}
        />
      ) : null}
      <Text
        style={[styles.buttonText, {color: grayed ? colors.icon : 'white',fontSize:fontSize}]}>
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
    fontFamily: WEIGHT.medium,
    color: 'white',
    marginLeft: 5,
  },
});
