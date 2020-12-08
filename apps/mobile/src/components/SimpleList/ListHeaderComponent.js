import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {COLORS_NOTE} from '../../utils/Colors';
import {hexToRGBA} from '../../utils/ColorUtils';
import {eScrollEvent} from '../../utils/Events';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {Placeholder} from '../ListPlaceholders';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {MessageCard} from './MessageCard';

export const ListHeaderComponent = ({
  type,
  messageCard = true,
  title,
  paragraph,
  color,
  onPress,
  shouldShow = false,
}) => {
  const [state] = useTracked();
  const {colors} = state;

  return type === 'search' ? null : DDS.isLargeTablet() && !shouldShow ? (
    <View
      style={{
        minHeight: 50,
        marginBottom: 5,
        padding: 12,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {messageCard && <MessageCard />}
    </View>
  ) : (
    <View
      style={{
        minHeight: 195,
        marginBottom: 5,
        padding: 12,
        width: '100%',
        backgroundColor: COLORS_NOTE[title.toLowerCase()]
          ? hexToRGBA(COLORS_NOTE[title.toLowerCase()], 0.15)
          : color || colors.shade,
      }}>
      {messageCard && <MessageCard color={COLORS_NOTE[title.toLowerCase()] || colors.accent} />}

      <View
        style={{
          right: 0,
          paddingRight: 12,
          opacity: 0.5,
          bottom: 0,
          paddingHorizontal: 12,
          position: 'absolute',
        }}>
        <Placeholder
          color={COLORS_NOTE[title.toLowerCase()] || colors.accent}
          w={normalize(150)}
          h={normalize(150)}
          type={type}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          paddingHorizontal: 12,
          paddingBottom: 12,
        }}>
        <Heading
          style={{marginBottom: paragraph ? -10 : 0}}
          size={SIZE.xxxl * 1.5}>
          <Heading size={SIZE.xxxl * 1.5} color={colors.accent}>
            {title.slice(0, 1) === '#' ? '#' : null}
          </Heading>

          {title.slice(0, 1) === '#' ? title.slice(1) : title}
        </Heading>
        {paragraph && (
          <Paragraph color={colors.icon}>
            {'\n'}or
            <Paragraph onPress={onPress} color={colors.accent}>
              {' ' + paragraph}
            </Paragraph>
          </Paragraph>
        )}
      </View>
    </View>
  );
};
