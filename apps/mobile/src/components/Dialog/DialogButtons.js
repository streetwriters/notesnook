import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';

const DialogButtons = ({
  onPressPositive,
  onPressNegative,
  positiveTitle,
  negativeTitle = 'Cancel',
}) => {
  return (
    <View style={styles.container}>
      <Button
        onPress={onPressNegative}
        fontSize={SIZE.md}
        type="gray"
        width="30%"
        title={negativeTitle}
      />
      {onPressPositive && (
        <Button
          onPress={onPressPositive}
          fontSize={SIZE.md}
          width="30%"
          type="transparent"
          title={positiveTitle}
        />
      )}
    </View>
  );
};

export default DialogButtons;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
});
