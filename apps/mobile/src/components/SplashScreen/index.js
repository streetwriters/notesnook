import React, {useEffect, useRef, useState} from 'react';
import {Image} from 'react-native';
import {View} from 'react-native';
import Animated, {Easing, timing, useValue} from 'react-native-reanimated';
import Carousel from 'react-native-snap-carousel';
import {SvgXml} from 'react-native-svg';
import {NOTE_SVG, LOGO_SVG, SYNC_SVG} from '../../assets/images/assets';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/EventManager';
import {dHeight, dWidth, getElevation} from '../../utils';
import {eOpenLoginDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import Storage from '../../utils/storage';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const SplashScreen = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const carouselRef = useRef();
  const [isNext, setIsNext] = useState(true);
  const opacity = useValue(0);
  const translateY = useValue(20);
  const translateY2 = useValue(0);
  const features = [
    {
      title: 'Notesnook',
      description: 'A safe place to write and get organized.',
      icon: require('../../assets/images/notesnook-logo-png.png'),
      type: 'image',
    },
    {
      title: 'Zero Knowledge',
      description: 'Write without fear, no tracking.',
      icon: SYNC_SVG,
    },
    {
      title: 'Zero Knowledge',
      description:
        'No sneaking, no stealing. We give all the keys for your data to you. Privacy is not just a word to us. We use industry-grade XChaChaPoly1305 and Argon2 which is miles ahead other solutions making sure your data is secure and private even a million years from now.',
    },
  ];

  useEffect(() => {
    Storage.read('introCompleted').then((r) => {
      if (!r) {
        setVisible(true);
        timing(opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.in(Easing.ease),
        }).start();
        timing(translateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.ease),
        }).start();
      }
    });
  }, []);

  const hide = async () => {
    timing(translateY2, {
      toValue: dHeight * 2,
      duration: 500,
      easing: Easing.in(Easing.ease),
    }).start();
    await sleep(500);
    setVisible(false);
  };

  return (
    visible && (
      <Animated.View
        style={{
          zIndex: 999,
          width: '100%',
          height: '100%',
          position: 'absolute',
          backgroundColor: colors.bg,
          transform: [
            {
              translateY: translateY2,
            },
          ],
        }}>
        <Animated.View
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
            opacity: opacity,
            transform: [
              {
                translateY: translateY,
              },
            ],
          }}>
          <View
            style={{
              height: 300,
            }}>
            <Carousel
              ref={carouselRef}
              data={features}
              itemWidth={dWidth}
              sliderWidth={dWidth}
              autoplay={false}
              loop={false}
			  shouldOptimizeUpdates
              autoplayInterval={5000}
              autoplayDelay={3000}
              onEndReached={() => {
                setIsNext(false);
              }}
              renderItem={({item, index}) => (
                <View
                  key={item.description}
                  style={{
                    paddingVertical: 5,
                    marginBottom: 10,
                    alignSelf: 'center',
                  }}>
                  <View
                    style={{
                      flexWrap: 'wrap',
                      width: '100%',
                      alignItems: 'center',
                    }}>
                    {item.type === 'image' ? (
                      <Image
                        source={item.icon}
                        style={{
                          width: 170,
                          height: 170,
                        }}
                      />
                    ) : (
                      <SvgXml
                        xml={
                          item.icon
                            ? item.icon(colors.accent)
                            : NOTE_SVG(colors.accent)
                        }
                        width={170}
                        height={170}
                      />
                    )}

                    {item.title && (
                      <Heading
                        size={SIZE.xl}
                        style={{
                          textAlign: 'center',
                          alignSelf: 'center',
                          marginTop: 10,
                        }}>
                        {item.title}
                      </Heading>
                    )}

                    {item.description && (
                      <Paragraph
                        size={SIZE.md}
                        color={colors.icon}
                        textBreakStrategy="balanced"
                        style={{
                          fontWeight: 'normal',
                          textAlign: 'center',
                          alignSelf: 'center',
                        }}>
                        {item.description}
                      </Paragraph>
                    )}
                  </View>
                </View>
              )}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              position: 'absolute',
              bottom: 25,
            }}>
            {isNext ? (
              <View />
            ) : (
              <Button
                fontSize={SIZE.md}
                onPress={async () => {
                  await hide();
                }}
                height={50}
                type="grayBg"
                style={{paddingHorizontal: 24}}
                title="Skip"
              />
            )}

            <Button
              fontSize={SIZE.md}
              height={50}
              onPress={async () => {
                if (isNext) {
                  carouselRef.current?.snapToNext();
                } else {
                  await hide();
                  eSendEvent(eOpenLoginDialog, 1);
                }
              }}
              style={{paddingHorizontal: 24}}
              type="accent"
              title={isNext ? 'Next' : 'Sign Up'}
            />
          </View>
        </Animated.View>
      </Animated.View>
    )
  );
};

export default SplashScreen;
