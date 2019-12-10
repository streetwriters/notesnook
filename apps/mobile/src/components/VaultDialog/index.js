import React, {useEffect, useState, createRef} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
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
import Icon from 'react-native-vector-icons/Feather';

import {getElevation, h, w, timeSince, ToastEvent} from '../../utils/utils';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import {useForceUpdate} from '../../views/ListsEditor';
import {db} from '../../../App';

let refs = [];

export const VaultDialog = ({visible, close}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const forceUpdate = useForceUpdate();
  const [hidden, setHidden] = useState(false);
  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={() => (refs = [])}>
      <View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255,255,255,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            width: '80%',
            maxHeight: 350,
            elevation: 5,
            borderRadius: 5,
            backgroundColor: colors.bg,
            paddingHorizontal: ph,
            paddingVertical: pv,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="shield" color={colors.accent} size={SIZE.lg} />
            <Text
              style={{
                color: colors.accent,
                fontFamily: WEIGHT.semibold,
                marginLeft: 10,
                fontSize: SIZE.lg,
                marginTop: -5,
              }}>
              Lock Note
            </Text>
          </View>

          <Text
            style={{
              color: colors.icon,
              fontFamily: WEIGHT.regular,
              textAlign: 'center',
              fontSize: SIZE.sm - 1,
              marginTop: 10,
              marginBottom: hidden ? 20 : 0,
            }}>
            {hidden
              ? 'Set password for all your locked notes.'
              : 'Do you want to lock this note?'}
          </Text>

          {!hidden ? null : (
            <View>
              <TextInput
                style={{
                  padding: pv - 5,
                  borderWidth: 1.5,
                  borderColor: colors.nav,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                }}
                onChangeText={value => {}}
                placeholder="Password"
                placeholderTextColor={colors.icon}
              />

              <TextInput
                style={{
                  padding: pv - 5,
                  borderWidth: 1.5,
                  borderColor: colors.nav,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                  marginTop: 10,
                }}
                onChangeText={value => {}}
                placeholder="Confirm password"
                placeholderTextColor={colors.icon}
              />
              <TextInput
                style={{
                  padding: pv - 5,
                  borderWidth: 1.5,
                  borderColor: colors.nav,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                  marginTop: 10,
                }}
                onChangeText={value => {}}
                placeholder="Hint"
                placeholderTextColor={colors.icon}
              />
            </View>
          )}

          <View
            style={{
              justifyContent: 'space-around',
              alignItems: 'center',
              flexDirection: 'row',
              marginTop: 20,
            }}>
            <TouchableOpacity
              activeOpacity={opacity}
              style={{
                paddingVertical: pv,
                paddingHorizontal: ph,
                borderRadius: 5,
                width: '45%',
                justifyContent: 'center',
                alignItems: 'center',
                borderColor: colors.accent,
                backgroundColor: colors.accent,
                borderWidth: 1,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  color: 'white',
                  fontSize: SIZE.sm,
                }}>
                Lock
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={opacity}
              onPress={() => {
                close();
              }}
              style={{
                paddingVertical: pv,
                paddingHorizontal: ph,
                borderRadius: 5,
                width: '45%',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.nav,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  color: colors.icon,
                  fontSize: SIZE.sm,
                }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const TopicItem = ({
  item,
  index,
  onFocus,
  onSubmit,
  onDelete,
  onChange,
  colors,
}) => {
  const [focus, setFocus] = useState(true);
  const topicRef = ref => (refs[index] = ref);

  let text = item;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: colors.nav,
        paddingHorizontal: ph,
        marginTop: 10,
      }}>
      <TextInput
        ref={topicRef}
        onFocus={() => {
          onFocus(index);

          setFocus(true);
        }}
        onBlur={() => {
          onSubmit(text, index, false);
          setFocus(false);
        }}
        onChangeText={value => {
          onChange(value, index);

          text = value;
        }}
        onSubmit={() => onSubmit(text, index, true)}
        blurOnSubmit
        style={{
          padding: pv - 5,
          paddingHorizontal: 0,
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
          width: '90%',
          maxWidth: '90%',
        }}
        placeholder="Add a topic"
        placeholderTextColor={colors.icon}
      />

      <TouchableOpacity
        onPress={() => (!focus ? onDelete(index) : onSubmit(text, index, true))}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Icon
          name={!focus ? 'minus' : 'plus'}
          size={SIZE.lg}
          color={colors.accent}
        />
      </TouchableOpacity>
    </View>
  );
};
