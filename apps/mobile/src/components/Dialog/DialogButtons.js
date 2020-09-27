import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
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
      <Button onPress={onPressPositive} title={positiveTitle} />
      <Button onPress={onPressNegative} title={negativeTitle} />
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
