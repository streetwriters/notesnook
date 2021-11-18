import React, {useEffect, useRef, useState} from 'react';
import {Image, SafeAreaView, View} from 'react-native';
import Animated, {Easing, timing, useValue} from 'react-native-reanimated';
import Carousel from 'react-native-snap-carousel';
import {SvgXml} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  COMMUNITY_SVG,
  NOTE_SVG,
  ORGANIZE_SVG,
  PRIVATE_SVG,
  RICH_TEXT_SVG,
  SYNC_SVG
} from '../../assets/images/assets';
import {useTracked} from '../../provider';
import {useSettingStore} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import {dHeight, dWidth, getElevation} from '../../utils';
import {eOpenLoginDialog} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const features = [
  {
    title: 'Welcome to Notesnook',
    description:
      'Did you know that the best note taking apps can secretly read all your notes? But Notesnook is different. How?',
    icon: require('../../assets/images/notesnook-logo-png.png'),
    type: 'image'
  },
  {
    title: '100% end-to-end encrypted notes',
    description:
      'All your notes are encrypted on your device. No one except you can read your notes.',
    icon: PRIVATE_SVG,
    link: 'https://docs.notesnook.com/how-is-my-data-encrypted/',
    linkText: 'Learn how we encrypt your data',
    img: 'privacy'
  },
  {
    icon: SYNC_SVG,
    title: 'Sync to unlimited devices',
    description:
      'Notesnook works 100% offline and you can install it on all your mobile, tablet and PC. Your notes are always with you where ever you go.',
    link: 'https://notesnook.com',
    img: 'sync'
  },
  {
    icon: RICH_TEXT_SVG,
    title: 'Write better. Faster. Smarter.',
    description:
      'Edit your notes the way you want. You can add images, videos, tables and even use markdown.',
    link: 'https://notesnook.com',
    img: 'sync'
  },
  {
    icon: ORGANIZE_SVG,
    title: 'Organize to remember, not to put away',
    description:
      'With notebooks, tags and colors you can find your notes easily.',
    link: 'https://notesnook.com',
    img: 'sync'
  },
  {
    icon: COMMUNITY_SVG,
    title: 'Join our community',
    description:
      'We are not ghosts, chat with us and share your experience. Give suggestions, report issues and meet other people using Notesnook',
    link: 'https://discord.gg/zQBK97EE22',
    linkText: 'Join now',
    img: 'community'
  },
  {
    icon: require('../../assets/images/to_the_stars.png'),
    title: 'Get started',
    description: 'Ready to start taking private notes?',
    img: 'community',
    type: 'image',
    size: 320
  }
];
let currentIndex = 0;
const SplashScreen = () => {
  const [state] = useTracked();
  const {colors} = state;
  const carouselRef = useRef();
  const [isNext, setIsNext] = useState(true);
  const isIntroCompleted = useSettingStore(state => state.isIntroCompleted);
  const setIntroCompleted = useSettingStore(state => state.setIntroCompleted);
  const opacity = useValue(0);
  const translateY = useValue(20);
  const translateY2 = useValue(0);

  useEffect(() => {
    if (!isIntroCompleted) {
      setTimeout(() => {
        timing(opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.in(Easing.ease)
        }).start();
        timing(translateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.ease)
        }).start();
      }, 15);
    }
  }, [isIntroCompleted]);

  const hide = async () => {
    timing(translateY2, {
      toValue: dHeight * 2,
      duration: 500,
      easing: Easing.in(Easing.ease)
    }).start();
    await sleep(500);
    setIntroCompleted(true);
  };

  return (
    !isIntroCompleted && (
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
              translateY: translateY2
            }
          ]
        }}>
        <SafeAreaView
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.nav
          }}>
          <Animated.View
            style={{
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: opacity
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
                  if (currentIndex === 6) {
                    setIsNext(false);
                  }
                }}
                maxToRenderPerBatch={10}
                renderItem={({item, index}) => (
                  <RenderItem item={item} index={index} />
                )}
              />
            </View>

            <View
              style={{
                width: '100%',
                position: 'absolute',
                bottom: 25,
                paddingHorizontal: 12
              }}>
              <Button
                fontSize={SIZE.md}
                height={50}
                width={DDS.isTab ? 350 : '100%'}
                onPress={async () => {
                  if (isNext) {
                    carouselRef.current?.snapToItem(
                      currentIndex + 1,
                      true,
                      true
                    );
                    currentIndex++;
                    if (currentIndex === 6) {
                      setIsNext(false);
                    }
                  } else {
                    await hide();
                    await MMKV.setItem('introCompleted', 'true');
                    await sleep(300);
                    eSendEvent(eOpenLoginDialog, 1);
                  }
                }}
                style={{
                  paddingHorizontal: 24,
                  alignSelf:'center' 
                }}
                type="accent"
                title={isNext ? 'Next' : 'Sign up'}
              />

              {isNext ? null : (
                <Button
                  fontSize={SIZE.md}
                  height={50}
                  width={DDS.isTab ? 350 : '100%'}
                  onPress={async () => {
                    await hide();
                    await MMKV.setItem('introCompleted', 'true');
                  }}
                  style={{
                    paddingHorizontal: 24,
                    alignSelf:'center',
                    marginTop: 10
                  }}
                  type="grayBg"
                  buttonType={{
                    color: '#808080',
                    selected: '#808080',
                    opacity: 0.15,
                  }}
                  title="I want to try the app first"
                />
              )}
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    )
  );
};

export default SplashScreen;

const RenderItem = ({item, index}) => {
  const [state] = useTracked();
  const {colors} = state;
  const translateY = useValue(0);
  const dimensions = useSettingStore(state => state.dimensions);
  let itemWidth = dimensions.width > 400 ? 320 : 260;

  useEffect(() => {
    if (index === 0) return;
    let value = 0;
    setInterval(() => {
      value = value === 0 ? 5 : 0;
      timing(translateY, {
        toValue: value,
        duration: 2000,
        easing: Easing.inOut(Easing.ease)
      }).start();
    }, 2000);
  }, []);

  return (
    <View
      style={{
        justifyContent: 'center',
        backgroundColor: colors.bg,
        alignSelf: 'center',
        width: '90%',
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
        height: '80%'
      }}>
      <View
        key={item.description}
        style={{
          paddingVertical: 5,
          marginBottom: 10,
          alignSelf: 'center'
        }}>
        <View
          style={{
            flexWrap: 'wrap',
            width: '100%',
            alignItems: 'center'
          }}>
          <Animated.View
            style={{
              transform: [
                {
                  translateY: translateY
                }
              ]
            }}>
            {item.type === 'image' ? (
              <Image
                source={item.icon}
                style={{
                  width: item.size || 170,
                  height: item.size || 170
                }}
              />
            ) : item.type === 'icon' ? (
              <Icon color={item.color} name={item.icon} size={170} />
            ) : (
              <SvgXml
                xml={
                  item.icon ? item.icon(colors.accent) : NOTE_SVG(colors.accent)
                }
                width={itemWidth}
                height={itemWidth}
              />
            )}
          </Animated.View>

          {item.title && (
            <Heading
              size={SIZE.xxl}
              textBreakStrategy="balanced"
              style={{
                textAlign: 'center',
                alignSelf: 'center',
                marginTop: 10,
                maxWidth: '90%',
                marginBottom: 10
              }}>
              {item.title}
            </Heading>
          )}

          {item.description && (
            <Paragraph
              size={SIZE.md}
              style={{
                fontWeight: 'normal',
                textAlign: 'center',
                alignSelf: 'center',
                maxWidth: DDS.isTab ? 350 : '90%',
                lineHeight: SIZE.md + 7
              }}>
              {item.description}
            </Paragraph>
          )}

          {item.link && (
            <Button
              title={item.linkText || 'Learn more'}
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
  );
};
