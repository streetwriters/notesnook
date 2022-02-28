import React, { useEffect, useState } from 'react';
import { useTracked } from '../../../provider';
import { useSettingStore } from '../../../provider/stores';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../services/EventManager';
import { history } from '../../../utils';
import { PressableButton } from '../../ui/pressable';
import { ActionStrip } from './action-strip';
import { Filler } from './back-fill';
import { SelectionIcon } from './selection';

const SelectionWrapper = ({ children, item, background, onLongPress, onPress, testID }) => {
  const [state, dispatch] = useTracked();
  const { colors } = state;
  const [actionStrip, setActionStrip] = useState(false);
  const settings = useSettingStore(state => state.settings);
  const listMode = item.type === 'notebook' ? settings.notebooksListMode : settings.notesListMode;
  const compactMode = (item.type === 'notebook' || item.type === 'note') && listMode === 'compact';

  const _onLongPress = () => {
    if (history.selectedItemsList.length > 0) return;
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
      onLongPress={_onLongPress}
      onPress={_onPress}
      customSelectedColor={colors.transGray}
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
        paddingVertical: compactMode ? 8 : 12
      }}
    >
      {actionStrip ? <ActionStrip note={item} setActionStrip={setActionStrip} /> : null}

      {item.type === 'note' ? <Filler background={background} item={item} /> : null}
      <SelectionIcon
        compactMode={compactMode}
        setActionStrip={setActionStrip}
        item={item}
        onLongPress={onLongPress}
      />
      {children}
    </PressableButton>
  );
};

export default SelectionWrapper;
