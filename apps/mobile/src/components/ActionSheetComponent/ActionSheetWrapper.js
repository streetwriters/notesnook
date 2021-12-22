import React from 'react';
import {Platform, View} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTracked} from '../../provider';
import {useSettingStore} from '../../provider/stores';
import {COLOR_SCHEME_DARK} from '../../utils/Colors';
import {Toast} from '../Toast';
import {BouncingView} from './BouncingView';
import {GetPremium} from './GetPremium';

const ActionSheetWrapper = ({
  children,
  fwdRef,
  gestureEnabled = true,
  onClose,
  onOpen,
  closeOnTouchBackdrop = true,
  onHasReachedTop,
  keyboardMode
}) => {
  const [state] = useTracked();
  const {colors} = state;
  const deviceMode = useSettingStore(state => state.deviceMode);
  const largeTablet = deviceMode === 'tablet';
  const smallTablet = deviceMode === 'smallTablet';
  const dimensions = useSettingStore(state => state.dimensions);
  const insets = useSafeAreaInsets();

  let width = dimensions.width > 600 ? 600 : 500;

  const style = React.useMemo(() => {
    return {
      width: largeTablet || smallTablet ? width : '100%',
      backgroundColor: colors.bg,
      zIndex: 10,
      paddingTop: 5,
      paddingBottom: 0,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      alignSelf: 'center',
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0
    };
  }, [colors.bg, gestureEnabled]);

  const _onOpen = () => {
    onOpen && onOpen();
  };

  const _onClose = async () => {
    //await reFocusEditor();
    if (onClose) {
      onClose();
    }
  };

  return (
    <ActionSheet
      ref={fwdRef}
      drawUnderStatusBar={false}
      containerStyle={style}
      gestureEnabled={gestureEnabled}
      initialOffsetFromBottom={1}
      onPositionChanged={onHasReachedTop}
      closeOnTouchBackdrop={closeOnTouchBackdrop}
      keyboardMode={keyboardMode}
      closeOnPressBack={closeOnTouchBackdrop}
      indicatorColor={colors.nav}
      onOpen={_onOpen}
      keyboardDismissMode="none"
      overlayColor={'#585858'}
      keyboardShouldPersistTaps="always"
      ExtraOverlayComponent={
        <>
          <Toast context="local" />
          <GetPremium
            context="sheet"
            close={() => fwdRef?.current?.hide()}
            offset={50}
          />
        </>
      }
      onClose={_onClose}>
      <BouncingView>
        {children}
        <View
          style={{
            height:
              Platform.OS === 'ios' && insets.bottom !== 0
                ? insets.bottom + 5
                : 20
          }}
        />
      </BouncingView>
    </ActionSheet>
  );
};

export default ActionSheetWrapper;
