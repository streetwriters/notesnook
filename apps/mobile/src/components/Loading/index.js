import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTracked } from '../../provider';
import { ph, pv, SIZE } from '../../utils/SizeUtils';
import { Button } from '../Button';
import Paragraph from '../Typography/Paragraph';

export const Loading = ({
  height = 150,
  tagline = 'Loading....',
  done = false,
  doneText = 'Action completed successfully!',
  onDone = () => {},
  customStyle = {}
}) => {
  const [state, dispatch] = useTracked();
  const { colors } = state;

  return (
    <View
      style={[
        { height: height, backgroundColor: colors.bg },
        styles.activityContainer,
        customStyle
      ]}
    >
      {done ? (
        <>
          <Paragraph color={colors.icon} size={SIZE.xs} style={styles.activityText}>
            {doneText}
          </Paragraph>

          <Button onPress={onDone} title="Open file" />
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.accent} />
          <Paragraph
            size={SIZE.md}
            style={{
              marginTop: 10
            }}
            color={colors.pri}
          >
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
    marginBottom: 10
  },
  activityContainer: {
    alignItems: 'center',
    justifyContent: 'center'
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
    flexDirection: 'row'
  },
  buttonText: {
    //fontFamily: "sans-serif",
    color: 'white',
    fontSize: SIZE.sm
  }
});
