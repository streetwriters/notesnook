import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import {opacity, ph, pv, SIZE, WEIGHT, COLOR_SCHEME} from '../../common/common';
import {useTracked} from '../../provider';

export const Button = ({
  height = 50,
  width = '48%',
  onPress = () => {},
  loading = false,
  grayed,
  title=""
}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, premiumUser} = state;

  return (
    <TouchableOpacity
      activeOpacity={opacity}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: grayed ? colors.nav : colors.accent,
          height: height,
          width: width,
        },
      ]}>
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      <Text
        style={[styles.buttonText, {color: grayed ? colors.icon : 'white'}]}>
        {title}
      </Text>
    </TouchableOpacity>
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
  button: {
    paddingVertical: pv,
    paddingHorizontal: ph,
    marginTop: 10,
    borderRadius: 5,
    alignSelf: 'center',
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: WEIGHT.medium,
    color: 'white',
    fontSize: SIZE.sm,
    marginLeft: 5,
  },
});
