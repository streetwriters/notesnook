import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {useTracked} from '../../provider';
import {normalize, SIZE} from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';
import {Placeholder} from '../ListPlaceholders';
import {eScrollEvent} from '../../utils/Events';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import Animated from 'react-native-reanimated';
import {dWidth} from '../../utils';
import {MessageCard} from './MessageCard';
import Paragraph from '../Typography/Paragraph';

const opacity = new Animated.Value(1);
export const ListHeaderComponent = ({
  type,
  data,
  messageCard = true,
  title,
  paragraph,
  color
}) => {
  const [state] = useTracked();
  const {colors, headerTextState} = state;

  const onScroll = async (y) => {
    if (y > 25) {
      let o = y / 125;
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

  return (
    <Animated.View
      style={{
        minHeight: 200,
        padding: 12,
        backgroundColor:color || colors.shade,
        opacity: opacity,
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
        <Placeholder w={normalize(150)} h={normalize(150)} type={type} />
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
    </Animated.View>
  );
};
