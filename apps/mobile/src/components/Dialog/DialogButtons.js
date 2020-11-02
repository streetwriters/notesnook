import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button} from '../Button';

const DialogButtons = ({
  onPressPositive,
  onPressNegative,
  positiveTitle,
  negativeTitle = 'Cancel',
}) => {
  return (
    <View
      style={styles.container}>

      <Button onPress={onPressNegative} grayed title={negativeTitle} />
      <Button onPress={onPressPositive} title={positiveTitle} />
    </View>
  );
};

export default DialogButtons;

const styles = StyleSheet.create({
  container:{
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
  }
})
