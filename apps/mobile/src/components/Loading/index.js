import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ph, pv, SIZE, WEIGHT } from '../../common/common';
import { useTracked } from '../../provider';
import { Button } from '../Button';

export const Loading = ({
  height = 150,
  tagline = 'Loading....',
  done = false,
  doneText = 'Action completed successfully!',
  onDone = () => {},
}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, premiumUser} = state;

  return (
    <View style={[{height: height}, styles.activityContainer]}>
      {done ? (
        <>
          <Text
            style={[
              {color: colors.icon},
              styles.activityText,
              {fontSize: SIZE.xs},
            ]}>
            {doneText}
          </Text>
          <Button
            onPress={onDone}
            title="Done"
            />
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.accent} />
          <Text style={[{color: colors.pri}, styles.activityText]}>
            {tagline}
          </Text>
        </>
      )}
    </View>
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
    borderWidth: 1,
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: WEIGHT.medium,
    color: 'white',
    fontSize: SIZE.sm,
  },
});
