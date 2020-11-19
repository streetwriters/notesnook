import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTracked} from '../../provider';
import {Button} from '../Button';
import {ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';

export const Loading = ({
  height = 150,
  tagline = 'Loading....',
  done = false,
  doneText = 'Action completed successfully!',
  onDone = () => {},
  customStyle = {},
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return (
    <View style={[{height: height}, styles.activityContainer, customStyle]}>
      {done ? (
        <>
          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={styles.activityText}>
            {doneText}
          </Paragraph>

          <Button onPress={onDone} title="Open File" />
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.accent} />
          <Paragraph color={colors.pri} style={styles.activityText}>
            {tagline}
          </Paragraph>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  activityText: {
    fontSize: SIZE.sm,
    textAlign: 'center',
    marginBottom: 10,
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
