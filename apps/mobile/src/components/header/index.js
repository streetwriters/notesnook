import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {useSafeArea} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE} from '../../common/common';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eCloseLoginDialog,
  eScrollEvent,
  eSetModalNavigator,
} from '../../services/events';
import NavigationService from '../../services/NavigationService';
import {sideMenuRef} from '../../utils/refs';
import {DDS, w} from '../../utils/utils';
import {moveNoteHideEvent} from '../DialogManager/recievers';
import {HeaderMenu} from './HeaderMenu';
import {HeaderTitle} from './HeaderTitle';
let offsetY = 0;
let timeout = null
function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  return update;
}

export const Header = ({showSearch, root}) => {
  const [state, dispatch] = useTracked();
  const {
    colors,
    syncing,
    isLoginNavigator,
    preventDefaultMargins,
    searchResults,
  } = state;
  const [hideHeader, setHideHeader] = useState(false);

  let headerState = root ? state.headerState : state.indHeaderState;

  const [isModalNavigator, setIsModalNavigator] = useState(false);
  const insets = useSafeArea();
  const forceUpdate = useForceUpdate();

 
  const onScroll = y => {
    if (searchResults.results.length > 0) return;
    if (y < 30) {
      setHideHeader(false);
      offsetY = y
    }
    if (y > offsetY) {
      if (y - offsetY < 100) return;
      clearTimeout(timeout);
      timeout = null
      timeout = setTimeout(() => {
        setHideHeader(true);
      },300); 
      offsetY = y
    } else {
      if (offsetY - y < 50) return;
      clearTimeout(timeout);
      timeout = null
      timeout = setTimeout(() => {
        setHideHeader(false);
      },300); 
      offsetY = y
    
    }
 
  };




  const _setModalNavigator = value => {
    if (root) return;
    forceUpdate();
    setIsModalNavigator(value);
  };

  useEffect(() => {
    eSubscribeEvent(eSetModalNavigator, _setModalNavigator);
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eSetModalNavigator, _setModalNavigator);
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        zIndex: 11,
        height: 50,
        marginTop:
          Platform.OS === 'ios'
            ? isModalNavigator && !root
              ? 0
              : insets.top
            : isModalNavigator && !root
            ? 0
            : insets.top,
        marginBottom: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        width: '100%',
        backgroundColor:colors.bg
      }}>
      <Animatable.View
        transition={['opacity']}
        duration={300}
        style={{
          width: 40,
          height: 40,
          position: 'absolute',
          left: w / 2 - 20,
          top: -20,
          opacity: syncing ? 1 : 0,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}>
        <View
          style={{
            backgroundColor: colors.bg,
            width: 40,
            height: 20,
            position: 'absolute',
            zIndex: 10,
            top: 0,
          }}
        />
        <ActivityIndicator size={25} color={colors.accent} />
      </Animatable.View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}>
        {headerState.canGoBack ? (
          <TouchableOpacity
            hitSlop={{top: 20, bottom: 20, left: 50, right: 40}}
            onPress={() => {
              headerState = root ? state.headerState : state.indHeaderState;

              if (headerState.navigation && preventDefaultMargins) {
                if (headerState.route.name === 'Folders') {
                  moveNoteHideEvent();
                } else {
                  headerState.navigation.goBack();
                }
              } else if (headerState.navigation && isModalNavigator) {
                if (headerState.route.name === 'Login') {
                  eSendEvent(eCloseLoginDialog);
                } else {
                  headerState.navigation.goBack();
                }
              } else {
                NavigationService.goBack();
              }
            }}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: 40,
              width: 60,
            }}>
            <Icon
              style={{
                marginLeft: -5,
              }}
              color={colors.pri}
              name={'arrow-left'}
              size={SIZE.xxxl - 3}
            />
          </TouchableOpacity>
        ) : (
          undefined
        )}
        {headerState.menu && !DDS.isTab ? (
          <TouchableOpacity
            hitSlop={{top: 20, bottom: 20, left: 50, right: 40}}
            onPress={() => {
              sideMenuRef.current?.openDrawer();
            }}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: 40,
              width: 60,
            }}>
            <Icon color={colors.pri} name={'menu'} size={SIZE.xxxl} />
          </TouchableOpacity>
        ) : (
          undefined
        )}

        <HeaderTitle root={root} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Animatable.View
          transition="opacity"
          useNativeDriver={true}
          duration={500}
          style={{
            opacity: hideHeader ? 1 : 0,
          }}>
          <TouchableOpacity
            onPress={() => {
              setHideHeader(false);
              eSendEvent('showSearch');
            }}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-end',
              height: 40,
              width: 60,
              paddingRight: 0,
            }}>
            <Icon name={'magnify'} size={SIZE.xl} color={colors.icon} />
          </TouchableOpacity>
        </Animatable.View>

        <HeaderMenu />
      </View>
    </View>
  );
};
