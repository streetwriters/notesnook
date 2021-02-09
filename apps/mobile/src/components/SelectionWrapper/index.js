import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import {ActionStrip} from './action-strip';
import {Filler} from './back-fill';

const SelectionWrapper = ({
  children,
  item,
  index,
  background,
  onLongPress,
  onPress,
  testID,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;
  const [selected, setSelected] = useState(false);
  const [actionStrip, setActionStrip] = useState(false);

  useEffect(() => {
    if (selectionMode) {
      setActionStrip(false);
      let exists = selectedItemsList.filter(
        (o) => o.dateCreated === item.dateCreated,
      );

      if (exists[0]) {
        if (!selected) {
          setSelected(true);
        }
      } else {
        if (selected) {
          setSelected(false);
        }
      }
    }
  }, [selectedItemsList]);

  const onLong = () => {
    if (selectionMode) return;
    if (item.type === 'topic' && item.title === 'General') return;

    setActionStrip(!actionStrip);
  };

  const _onPress = async () => {
    if (actionStrip) {
      setActionStrip(false);
      return;
    }
    await onPress();
  };

  const closeStrip = () => {
    setActionStrip(false);
  };

  useEffect(() => {
    eSubscribeEvent('navigate', closeStrip);

    return () => {
      eUnSubscribeEvent('navigate', closeStrip);
    };
  }, []);

  return (
    <PressableButton
      customColor="transparent"
      testID={testID}
      onLongPress={onLong}
      onPress={_onPress}
      customSelectedColor={colors.nav}
      customAlpha={!colors.night ? -0.02 : 0.02}
      customOpacity={1}
      customStyle={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        paddingHorizontal: 12,
        marginTop:
          index === 0 && !selectionMode
            ? 15
            : index === 0 && selectionMode
            ? 30
            : 0,
      }}>
      {actionStrip && (
        <ActionStrip note={item} setActionStrip={setActionStrip} />
      )}

      {item.type === 'note' && <Filler background={background} item={item} />}

      {selectionMode && (
        <View
          style={{
            display: 'flex',
            opacity: 1,
            width: '10%',
            height: 70,
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 8,
          }}>
          {item.type !== 'topic' ||
          (item.type === 'topic' && item.title !== 'General') ? (
            <TouchableOpacity
              activeOpacity={1}
              onPress={onLongPress}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                height: 70,
              }}>
              <Icon
                size={SIZE.lg}
                color={selected ? colors.accent : colors.icon}
                name={
                  selected
                    ? 'check-circle-outline'
                    : 'checkbox-blank-circle-outline'
                }
              />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {children}
    </PressableButton>
  );
};

export default SelectionWrapper;
