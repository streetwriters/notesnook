import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import Paragraph from '../Typography/Paragraph';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';

const DialogButtons = ({
  onPressPositive,
  onPressNegative,
  positiveTitle,
  negativeTitle = 'Cancel',
  loading,
  doneText,
  positiveType
}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <View style={[styles.container,{
      backgroundColor:colors.nav,
      height:60,
      borderBottomRightRadius:10,
      borderBottomLeftRadius:10,
      paddingHorizontal:12
    }]}>
      {loading ? (
        <ActivityIndicator color={colors.accent} size={SIZE.lg} />
      ) : doneText ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Icon
            color={colors.accent}
            name="check-circle-outline"
            size={SIZE.md}
          />
          <Paragraph color={colors.accent}>{' ' + doneText}</Paragraph>
        </View>
      ) : (
        <View />
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Button
          onPress={onPressNegative}
          fontSize={SIZE.md}
          testID={notesnook.ids.default.dialog.no}
          type="gray"
          bold
          title={negativeTitle}
        />
        {onPressPositive ? (
          <Button
            onPress={onPressPositive}
            fontSize={SIZE.md}
            testID={notesnook.ids.default.dialog.yes}
            style={{
              marginLeft: 10,
            }}
            bold
            type={positiveType || "transparent"}
            title={positiveTitle}
          />
        ) : null}
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
    marginTop: 10,
  },
});
