import React from 'react';
import { Text } from 'react-native';
import { View } from 'react-native';
import { useThemeStore } from '../../stores/use-theme-store';
import { SIZE } from '../../utils/size';
import { Button } from '../ui/button';
import { PressableButtonProps } from '../ui/pressable';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

type DialogHeaderProps = {
  icon?: string;
  title?: string;
  paragraph?: string;
  button?: {
    onPress?: () => void;
    loading?: boolean;
    title?: string;
    type?: PressableButtonProps['type'];
  };
  paragraphColor?: string;
  padding?: number;
  centered?: boolean;
  titlePart?: string;
};

const DialogHeader = ({
  icon,
  title,
  paragraph,
  button,
  paragraphColor,
  padding,
  centered,
  titlePart
}: DialogHeaderProps) => {
  const colors = useThemeStore(state => state.colors);

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 50,
          paddingHorizontal: padding
        }}
      >
        <View
          style={{
            width: '100%'
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: centered ? 'center' : 'space-between',
              alignItems: 'center'
            }}
          >
            <Heading style={{ textAlign: centered ? 'center' : 'left' }} size={SIZE.xl}>
              {title} {titlePart ? <Text style={{ color: colors.accent }}>{titlePart}</Text> : null}
            </Heading>

            {button ? (
              <Button
                onPress={button.onPress}
                style={{
                  borderRadius: 100,
                  paddingHorizontal: 12
                }}
                loading={button.loading}
                fontSize={13}
                title={button.title}
                type={button.type || 'grayBg'}
                height={25}
              />
            ) : null}
          </View>

          {paragraph ? (
            <Paragraph
              style={{
                textAlign: centered ? 'center' : 'left',
                maxWidth: centered ? '90%' : '100%',
                alignSelf: centered ? 'center' : 'flex-start'
              }}
              color={paragraphColor || colors.icon}
            >
              {paragraph}
            </Paragraph>
          ) : null}
        </View>
      </View>
    </>
  );
};

export default DialogHeader;
