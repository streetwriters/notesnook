import React from 'react';
import { Image, TextStyle, View, ViewStyle } from 'react-native';
import { useTracked } from '../../provider';
import { eSendEvent, presentSheet } from '../../services/EventManager';
import { TTip } from '../../services/tip-manager';
import { eCloseProgressDialog } from '../../utils/Events';
import { MMKV } from '../../utils/mmkv';
import { SIZE } from '../../utils/SizeUtils';
import { Button } from '../Button';
import Seperator from '../Seperator';
import Paragraph from '../Typography/Paragraph';

export const Tip = ({
  tip,
  style,
  neverShowAgain,
  noImage,
  textStyle,
  color
}: {
  tip: TTip;
  style?: ViewStyle;
  textStyle?: TextStyle;
  neverShowAgain: boolean;
  noImage?: boolean;
  color?: string;
}) => {
  const [state] = useTracked();
  const { colors } = state;

  return tip ? (
    <View
      style={[
        {
          borderRadius: 10,
          padding: 12,
          width: '100%',
          alignSelf: 'center',
          paddingVertical: 12,
          backgroundColor: colors.nav
        },
        style
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <Button
          //@ts-ignore
          title="TIP"
          icon="information"
          fontSize={SIZE.xs}
          iconSize={SIZE.xs}
          style={{
            width: null,
            height: 22,
            paddingHorizontal: 4,
            alignSelf: 'flex-start',
            borderRadius: 100,
            borderWidth: 1,
            //@ts-ignore
            borderColor: colors[color]
          }}
        />

        {neverShowAgain && (
          <Button
            //@ts-ignore
            title="Never show again"
            type="grayBg"
            icon="close"
            fontSize={SIZE.xs}
            iconSize={SIZE.xs}
            onPress={() => {
              MMKV.setItem('neverShowSheetTips', 'true');
              eSendEvent(eCloseProgressDialog);
            }}
            style={{
              width: null,
              height: 25,
              paddingHorizontal: 4,
              alignSelf: 'flex-start',
              borderRadius: 100,
              borderWidth: 1,
              borderColor: colors.icon
            }}
          />
        )}
      </View>

      <Seperator half />
      <Paragraph style={textStyle} color={colors.pri} size={SIZE.md}>
        {tip.text}
      </Paragraph>
      {tip.image && !noImage && (
        <View
          style={{
            borderRadius: 10,
            overflow: 'hidden',
            marginTop: 10
          }}
        >
          <Image
            source={{ uri: tip.image }}
            style={{
              width: '100%',
              height: 230,
              alignSelf: 'center'
            }}
          />
        </View>
      )}

      {tip.button && (
        <Button
          //@ts-ignore
          title={tip.button.title}
          type="accent"
          icon={tip.button.icon}
          accentText="white"
          accentColor={color}
          style={{
            marginTop: 10
          }}
          onPress={() => {
            switch (tip.button?.action) {
              default:
                break;
            }
          }}
        />
      )}
    </View>
  ) : null;
};

Tip.present = async (tip: TTip) => {
  if (!tip) return;
  let dontShow = await MMKV.getItem('neverShowSheetTips');
  if (dontShow) return;
  presentSheet({
    component: (
      <Tip
        tip={tip}
        neverShowAgain={true}
        style={{
          backgroundColor: 'transparent',
          paddingHorizontal: 12
        }}
      />
    )
  });
};
