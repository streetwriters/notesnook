import React from 'react';
import { Text } from 'react-native';
import { View } from 'react-native';
import { useThemeStore } from '../../stores/theme';
import { SIZE } from '../../utils/size';
import { Button } from '../ui/button';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

const DialogHeader = ({
  icon,
  title,
  paragraph,
  button,
  paragraphColor,
  padding,
  centered,
  titlePart
}) => {
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
            <Heading size={SIZE.xl}>
              {title} {titlePart ? <Text style={{ color: colors.accent }}>{titlePart}</Text> : null}
            </Heading>

            {button ? (
              <Button
                onPress={button.onPress}
                style={{
                  borderRadius: 100,
                  paddingHorizontal: 12
                }}
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
