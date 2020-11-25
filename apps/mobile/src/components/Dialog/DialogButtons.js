import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';

const DialogButtons = ({
  onPressPositive,
  onPressNegative,
  positiveTitle,
  negativeTitle = 'Cancel',
  loading,
}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.accent} size={SIZE.lg} />
      ) : <View/>}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Button
          onPress={onPressNegative}
          fontSize={SIZE.md}
          type="gray"
          title={negativeTitle}
        />
        {onPressPositive && (
          <Button
            onPress={onPressPositive}
            fontSize={SIZE.md}
            style={{
              marginLeft: 10,
            }}
            type="transparent"
            title={positiveTitle}
          />
        )}
      </View>
    </View>
  );
};

export default DialogButtons;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
});
