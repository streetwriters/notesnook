import React from 'react';
import { View } from 'react-native';
import { PressableButton } from '../../components/ui/pressable';
import Paragraph from '../../components/ui/typography/paragraph';
import { useThemeStore } from '../../stores/theme';
import { SIZE } from '../../utils/size';

export const CustomButton = ({ title, tagline, customComponent, onPress, color = null }) => {
  const colors = useThemeStore(state => state.colors);
  return (
    <PressableButton
      onPress={onPress}
      customStyle={{
        minHeight: 50,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        width: '100%',
        borderRadius: 0,
        flexDirection: 'row'
      }}
    >
      <View
        style={{
          flexShrink: 1
        }}
      >
        <Paragraph
          size={SIZE.md}
          color={color || colors.pri}
          style={{
            textAlignVertical: 'center',
            flexWrap: 'wrap'
          }}
        >
          {title}
        </Paragraph>
        <Paragraph
          style={{
            flexWrap: 'wrap',
            paddingRight: 10
          }}
          size={SIZE.sm}
          color={colors.icon}
        >
          {tagline}
        </Paragraph>
      </View>
      {customComponent ? customComponent : null}
    </PressableButton>
  );
};
