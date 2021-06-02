import React, {useEffect, useState} from 'react';
import {useWindowDimensions} from 'react-native';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {history} from '../../utils';
import {PressableButton} from '../PressableButton';
import {ActionStrip} from './action-strip';
import {Filler} from './back-fill';
import {SelectionIcon} from './selection';

const SelectionWrapper = ({
  children,
  item,
  background,
  onLongPress,
  onPress,
  height,
  testID,
}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [actionStrip, setActionStrip] = useState(false);
  const {fontScale} = useWindowDimensions();

  const _onLongPress = () => {
    if (history.selectedItemsList.length > 0) return;
    setActionStrip(!actionStrip);
  };

  const _onPress = async () => {

    if (actionStrip) {
      setActionStrip(false);
      return;
    }
    console.log('clicking',onPress);
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
      onLongPress={_onLongPress}
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
        marginTop: 0,
        height: height * fontScale,
      }}>
      {actionStrip && (
        <ActionStrip note={item} setActionStrip={setActionStrip} />
      )}

      {item.type === 'note' && <Filler background={background} item={item} />}
      <SelectionIcon
        setActionStrip={setActionStrip}
        item={item}
        onLongPress={onLongPress}
      />
      {children}
    </PressableButton>
  );
};

export default SelectionWrapper;
