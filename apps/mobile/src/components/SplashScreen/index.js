import React, {useEffect, useRef, useState} from 'react';
import {Image, View} from 'react-native';
import Animated, {Easing, timing, useValue} from 'react-native-reanimated';
import Carousel from 'react-native-snap-carousel';
import {SvgXml} from 'react-native-svg';
import {
  NOTE_SVG,
  SYNC_SVG,
  ORGANIZE_SVG,
  PRIVACY_SVG,
  COMMUNITY_SVG,
} from '../../assets/images/assets';
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

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {DDS} from '../../services/DeviceDetection';
import {openLinkInBrowser} from '../../utils/functions';
import {Modal} from 'react-native';
import {SafeAreaView} from 'react-native';
import {SvgToPngView} from '../ListPlaceholders';
import {MMKV} from '../../utils/mmkv';

const features = [
  {
    title: 'Notesnook',
    description: 'A safe place to write and stay organized.',
    icon: require('../../assets/images/notesnook-logo-png.png'),
    type: 'image',
  },
  {
    title: 'Made to protect your privacy',
    description:
      'Your data is encrypted on your device. No one but you can read your notes.',
    icon: PRIVACY_SVG,
    link: 'https://notesnook.com',
    img: 'privacy',
  },
  {
    icon: SYNC_SVG,
    title: 'While keeping you in sync',
    description:
      'Everything is automatically synced to all your devices in a safe and secure way. Notesnook is available on all major platforms.',
    link: 'https://notesnook.com',
    img: 'sync',
  },
  {
    icon: ORGANIZE_SVG,
    title: 'And helping you stay organized',
    description:
      'Add your notes in notebooks and topics or simply assign tags or colors to find them easily.',
    link: 'https://notesnook.com',
    img: 'sync',
  },
  {
    icon: COMMUNITY_SVG,
    title: 'Join our community',
    description:
      'We are not ghosts, chat with us and share your experience. Give suggestions, report issues and meet other people using Notesnook',
    link: 'https://discord.gg/zQBK97EE22',
    img: 'community',
  },
];
let currentIndex = 0;
const SplashScreen = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const carouselRef = useRef();
  const [isNext, setIsNext] = useState(true);

  const opacity = useValue(0);
  const translateY = useValue(20);
  const translateY2 = useValue(0);

  useEffect(() => {
    MMKV.getStringAsync('introCompleted').then(async r => {
      setTimeout(() => {
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
      }, 1);
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
          ...getElevation(10),
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
        <SafeAreaView
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.bg,
          }}>
          <Animated.View
            style={{
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 12,
              opacity: opacity,
            }}>
            <View>
              <Carousel
                ref={carouselRef}
                data={features}
                itemWidth={dWidth}
                sliderWidth={dWidth}
                loop={false}
                onSnapToItem={i => {
                  currentIndex = i;
                }}
                maxToRenderPerBatch={10}
                renderItem={({item, index}) => (
                  <View
                    style={{
                      height: '100%',
                      justifyContent: 'center',
                    }}>
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
                        ) : item.type === 'icon' ? (
                          <Icon
                            color={item.color}
                            name={item.icon}
                            size={170}
                          />
                        ) : (
                          <SvgXml
                            xml={
                              item.icon
                                ? item.icon(colors.accent)
                                : NOTE_SVG(colors.accent)
                            }
                            //img={item.img}
                            //color={colors.accent}
                            width={250}
                            height={250}
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
                              maxWidth: DDS.isTab ? 350 : '80%',
                            }}>
                            {item.description}
                          </Paragraph>
                        )}

                        {item.link && (
                          <Button
                            title="Learn more"
                            fontSize={SIZE.md}
                            onPress={() => {
                              try {
                                openLinkInBrowser(item.link, colors);
                              } catch (e) {
                                console.log(e, 'ERROR');
                              }
                            }}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                )}
              />
            </View>

            <View
              style={{
                width: '100%',
                position: 'absolute',
                bottom: 25,
              }}>
              <Button
                fontSize={SIZE.md}
                height={50}
                width={isNext ? null : DDS.isTab ? 250 : '100%'}
                onPress={async () => {
                  if (isNext) {
                    carouselRef.current?.snapToItem(
                      currentIndex + 1,
                      true,
                      true,
                    );
                    currentIndex++;
                    if (currentIndex === 4) {
                      setIsNext(false);
                    }
                  } else {
                    await hide();
                    await Storage.write('introCompleted', 'true');
                  }
                }}
                style={{
                  paddingHorizontal: 24,
                  alignSelf: !isNext ? 'center' : 'flex-end',
                }}
                type="accent"
                title={isNext ? 'Next' : 'Start taking notes'}
              />
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    )
  );
};

export default SplashScreen;
