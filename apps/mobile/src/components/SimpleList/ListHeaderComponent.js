import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {COLORS_NOTE} from '../../utils/Colors';
import {hexToRGBA} from '../../utils/ColorUtils';
import {eScrollEvent} from '../../utils/Events';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {Placeholder} from '../ListPlaceholders';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {MessageCard} from './MessageCard';

const opacity = new Animated.Value(1);
export const ListHeaderComponent = ({
  type,
  messageCard = true,
  title,
  paragraph,
  color,
}) => {
  const [state] = useTracked();
  const {colors, headerTextState, currentScreen} = state;
/* 
  const onScroll = async (y) => {
    if (y > 100) {
      let o = (y - 100) / 100;
      o = 1 - o;
      console.log(o);
      opacity.setValue(o);
    } else {
      opacity.setValue(1);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);
 */
  return type === 'search' ? null : (
    <View
      style={{
        minHeight: 195,
        marginBottom: 5,
        padding: 12,
        width: '100%',
        backgroundColor: COLORS_NOTE[currentScreen]
          ? hexToRGBA(COLORS_NOTE[currentScreen], 0.15)
          : color || colors.shade,
      }}>
      {messageCard && <MessageCard />}

      {/*     <Icon style={{
        position:'absolute',
        right:0,
      }} name="home" color={colors.bg} size={SIZE.xxxl * 4} />  */}

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
          color={COLORS_NOTE[currentScreen]}
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
          size={SIZE.xxxl * 1.5}
          color={headerTextState.color}>
          <Text
            style={{
              color: colors.accent,
            }}>
            {headerTextState.heading.slice(0, 1) === '#' ? '#' : null}
          </Text>

          {title
            ? title
            : headerTextState.heading.slice(0, 1) === '#'
            ? headerTextState.heading.slice(1)
            : headerTextState.heading}
        </Heading>
        {paragraph && (
          <Paragraph color={colors.icon}> {'\n' + paragraph}</Paragraph>
        )}
      </View>
    </View>
  );
};
