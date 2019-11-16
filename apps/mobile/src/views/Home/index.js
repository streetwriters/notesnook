import React, {Fragment, useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';

import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';
import {styles} from './styles';

import Icon from 'react-native-vector-icons/Ionicons';
import {FlatList} from 'react-native-gesture-handler';
export const Home = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(COLOR_SCHEME);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  });

  return (
    <View style={styles.container}>
      <Search />

      <ScrollView
        horizontal={true}
        style={{
          paddingHorizontal: '5%',
          height: 200,
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'row',
        }}>
        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: 100,
            height: 100,
            borderRadius: br,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            marginRight: 30,
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="md-add" color="white" size={SIZE.xxl} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: 100,
            height: 100,
            borderRadius: br,
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="ios-clock" color={colors.icon} size={SIZE.xxl} />
            <Text
              style={{
                fontSize: SIZE.sm - 2,
                color: colors.icon,
                fontFamily: WEIGHT.regular,
              }}>
              Reminders
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: 100,
            height: 100,
            borderRadius: br,
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            marginLeft: 30,
            marginRight: 30,
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="ios-list" color={colors.icon} size={SIZE.xxl} />
            <Text
              style={{
                fontSize: SIZE.sm - 2,
                color: colors.icon,
                fontFamily: WEIGHT.regular,
              }}>
              Lists
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Reminder />

      <RecentList />
    </View>
  );
};

Home.navigationOptions = {
  header: null,
};

export default Home;

export const Search = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '90%',
        backgroundColor: '#f0f0f0',
        alignSelf: 'center',
        borderRadius: br,
        paddingHorizontal: ph,
        paddingVertical: pv - 5,
        elevation: 5,
        marginTop: 25,
      }}>
      <TextInput
        style={{
          fontFamily: WEIGHT.regular,
          maxWidth: '90%',
          width: '90%',
        }}
        numberOfLines={1}
        placeholder="Search your notes"
      />
      <Icon
        style={{paddingRight: '2.5%'}}
        name="ios-search"
        color={colors.icon}
        size={SIZE.xl}
      />
    </View>
  );
};

export const Reminder = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <TouchableOpacity
      activeOpacity={opacity}
      style={{
        width: '90%',
        marginVertical: '5%',
        alignSelf: 'center',
        borderRadius: br,
        backgroundColor: colors.accent,
        elevation: 5,
        paddingHorizontal: ph,
        paddingVertical: 5,
      }}>
      <View
        style={{
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Icon
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
          name="ios-clock"
          color="white"
          size={SIZE.md}
        />

        <Text
          style={{
            paddingBottom: 5,
          }}>
          <Text
            style={{
              color: 'white',
              fontSize: SIZE.lg,
              fontFamily: WEIGHT.bold,
            }}>
            Pay Utility Bills
          </Text>
          <Text
            style={{
              fontFamily: WEIGHT.light,
              fontSize: SIZE.xs,
              color: 'white',
            }}>
            {'\n'}
            Amount 5000 RS
          </Text>
        </Text>

        <Text
          style={{
            color: 'white',
            fontSize: SIZE.xxl,
            fontFamily: WEIGHT.light,
          }}>
          <Text
            style={{
              fontSize: SIZE.xs,
            }}>
            in
          </Text>
          00:00{''}
          <Text
            style={{
              fontSize: SIZE.xs,
            }}>
            mins
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const RecentList = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: '5%',
          marginTop: '7.5%',
          marginBottom: '0%',
        }}>
        <Text
          style={{
            fontSize: SIZE.lg,
            color: colors.icon,
            fontFamily: WEIGHT.regular,
          }}>
          Recents
        </Text>
        <Icon name="ios-albums" color={colors.icon} size={SIZE.xl} />
      </View>

      <FlatList
        data={[
          {
            title: 'One day about',
            headline:
              'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has',
            timestamp: '2 hours ago',
            type: 'note',
          },
          {
            title: 'Shopping List',
            headline:
              'It is a long established fact that a reader will be distracted by the readable content of',
            timestamp: '5 hours ago',
            type: 'list',
          },
          {
            title: 'Reminder',
            headline:
              'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a ',
            timestamp: '2 days ago',
            type: 'reminder',
          },
          {
            title: 'Writing Notes for',
            headline:
              'There are many variations of passages of Lorem Ipsum available, but the majority have ',
            timestamp: '2 months ago',
          },
        ]}
        renderItem={({item, index}) => (
          <TouchableOpacity
            activeOpacity={opacity}
            style={{
              marginHorizontal: '5%',
              backgroundColor: '#f0f0f0',
              marginVertical: '2.5%',
              borderRadius: br,
              paddingVertical: pv - 5,
            }}>
            <Text
              style={{
                fontSize: SIZE.md,
                paddingHorizontal: ph,
                paddingTop: pv,
                fontFamily: WEIGHT.bold,
              }}>
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: SIZE.xs + 1,
                paddingHorizontal: ph,
                color: colors.icon,
                fontFamily: WEIGHT.regular,
              }}>
              {item.headline}
            </Text>

            <View
              style={{
                height: 30,
                width: '100%',
                borderRadius: 5,
                justifyContent: 'space-between',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: ph,
              }}>
              <Text
                style={{
                  color: colors.accent,
                  fontSize: SIZE.xxs,
                  textAlignVertical: 'center',
                  fontFamily: WEIGHT.regular,
                }}>
                {item.timestamp + '  '}
              </Text>

              <View
                style={{
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '15%',
                }}>
                <Icon name="ios-share" color={colors.accent} size={SIZE.lg} />
                <Icon name="ios-trash" color={colors.accent} size={SIZE.lg} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  );
};
