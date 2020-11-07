import React, { useEffect, useState } from 'react';
import {ActivityIndicator, Platform, StyleSheet, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTracked} from '../../provider';
import {eSendEvent, eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {dWidth} from '../../utils';
import {ActionIcon} from '../ActionIcon';
import {HeaderMenu} from './HeaderMenu';
import {HeaderTitle} from './HeaderTitle';
import {SIZE} from "../../utils/SizeUtils";
import {HeaderLeftMenu} from "./HeaderLeftMenu";
import { eScrollEvent } from '../../utils/Events';

let timeout = null;
export const Header = ({ root}) => {
  const [state, ] = useTracked();
  const {colors, syncing} = state;
  const insets = useSafeAreaInsets();
  const [hideHeader,setHideHeader] = useState(false);

  const {
    searchResults,
  } = state;
  let offsetY = 0;


  const onScroll = (y) => {
    if (searchResults.results.length > 0) return;
    if (y < 30) {
      setHideHeader(false);
      offsetY = y;
    }
    if (y > offsetY) {
      if (y - offsetY < 100) return;
      clearTimeout(timeout);
      timeout = null;
      timeout = setTimeout(() => {
        setHideHeader(true);
      }, 300);
      offsetY = y;
    } else {
      if (offsetY - y < 50) return;
      clearTimeout(timeout);
      timeout = null;
      timeout = setTimeout(() => {
        setHideHeader(false);
      }, 300);
      offsetY = y;
    }
  };

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          marginTop: insets.top,
          backgroundColor: colors.bg,
          overflow: 'hidden',
        },
      ]}>
      <View style={styles.leftBtnContainer}>
        <HeaderLeftMenu/>
        {Platform.OS === 'android' ? <HeaderTitle root={root} /> : null}
      </View>
      {Platform.OS !== 'android' ? <HeaderTitle root={root} /> : null}

      <Animatable.View
        transition={['opacity']}
        duration={300}
        style={[
          styles.loadingContainer,
          {
            opacity: syncing ? 1 : 0,
          },
        ]}>
        <View
          style={[
            styles.loadingInnerContainer,
            {
              backgroundColor: colors.bg,
            },
          ]}
        />
        <ActivityIndicator size={25} color={colors.accent} />
      </Animatable.View>

      <View style={styles.rightBtnContainer}>
        <Animatable.View
          transition="opacity"
          useNativeDriver={true}
          duration={500}
          style={{
            opacity: hideHeader ? 1 : 0,
          }}>
          <ActionIcon
            onPress={() => {
              if (!hideHeader) return;
              setHideHeader(false);
              eSendEvent('showSearch');
            }}
            name="magnify"
            size={SIZE.xl}
            color={colors.pri}
            style={styles.rightBtn}
          />
        </Animatable.View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    zIndex: 11,
    height: 50,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  loadingContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    left: dWidth / 2 - 20,
    top: -20,
    width: 40,
    height: 40,
    position: 'absolute',
  },
  loadingInnerContainer: {
    width: 40,
    height: 20,
    position: 'absolute',
    zIndex: 10,
    top: 0,
  },
  leftBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'absolute',
    left: 12,
  },
  leftBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    borderRadius: 100,
    marginLeft: -5,
    marginRight: 25,
  },
  rightBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 12,
  },
  rightBtn: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 40,
    width: 50,
    paddingRight: 0,
  },
});
