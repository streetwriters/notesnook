import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Text,
  Keyboard,
  Platform,
} from 'react-native';
import {COLOR_SCHEME, opacity, pv, br, SIZE, WEIGHT} from '../../common/common';
import {Search} from '../../components/SearchInput';
import {w, h, SideMenuEvent, getElevation, ToastEvent} from '../../utils/utils';
import {Header} from '../../components/header';
import {NotesList} from '../../components/NotesList';
import {db} from '../../../App';
import Icon from 'react-native-vector-icons/Feather';
import NavigationService from '../../services/NavigationService';
import * as Animatable from 'react-native-animatable';
import {useAppContext} from '../../provider/useAppContext';
import {DDS} from '../../../App';
 
export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const Container = ({
  children,
  bottomButtonOnPress,
  bottomButtonText,
  noBottomButton = false,
}) => {
  // State
  const {colors} = useAppContext();

  const [buttonHide, setButtonHide] = useState(false);

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setButtonHide(true);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => {
        setButtonHide(false);
      }, 100);
    });
    return () => {
      Keyboard.removeListener('keyboardDidShow', () => {
        setButtonHide(true);
      });
      Keyboard.removeListener('keyboardDidHide', () => {
        setTimeout(() => {
          setButtonHide(false);
        }, 100);
      });
    };
  }, []);
  // Render

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        backgroundColor: colors.night ? colors.bg : colors.bg,
      }}>
      <KeyboardAvoidingView
        behavior="padding"
        enabled={Platform.OS === 'ios' ? true : false}
        style={{
          height: '100%',
        }}>
        {children}

        {buttonHide || noBottomButton ? null : (
          <TouchableOpacity
            onPress={bottomButtonOnPress}
            activeOpacity={opacity}
            style={{
              width: '95%',
              alignSelf: 'center',
              borderRadius: br,
              backgroundColor: colors.accent,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
            <View
              style={{
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'row',
                width: '100%',
                padding: pv,
                paddingVertical: pv + 5,
              }}>
              <Icon name="plus" color="white" size={SIZE.lg} />
              <Text
                style={{
                  fontSize: SIZE.md,
                  color: 'white',
                  fontFamily: WEIGHT.regular,
                  textAlignVertical: 'center',
                }}>
                {'  ' + bottomButtonText}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

export default Container;
