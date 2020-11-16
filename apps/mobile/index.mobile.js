import React, {useEffect} from 'react';
import {View} from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import ContextMenu from './src/components/ContextMenu';
import {DialogManager} from './src/components/DialogManager';
import {DummyText} from './src/components/DummyText';
import {Toast} from './src/components/Toast';
import {NavigationStack} from './src/navigation/Drawer';
import {NavigatorStack} from './src/navigation/NavigatorStack';
import {useTracked} from './src/provider';
import {eSendEvent} from './src/services/EventManager';
import {editing} from './src/utils';
import {eCloseSideMenu, eOnLoadNote, eOpenSideMenu} from './src/utils/Events';
import {tabBarRef} from './src/utils/Refs';
import {sleep} from './src/utils/TimeUtils';
import {EditorWrapper} from './src/views/Editor/EditorWrapper';
import {getIntent, getNote, post} from './src/views/Editor/Functions';
/* 
const editorRef = createRef();
  
const AnimatedScreenContainer = Animated.createAnimatedComponent(
  ScreenContainer,
);
 */
export const Initialize = () => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <>
      <View
        testID={'mobile_main_view'}
        style={{
          width: '100%',
          height: '100%',
          flexDirection: 'row',
          backgroundColor: colors.bg,
        }}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.bg,
          }}>
          <NavigationStack component={MobileStack} />
        </View>
      </View>
      <Toast />
      <ContextMenu />
      <DummyText />
      <DialogManager colors={colors} />
    </>
  );
};

let timeout = null;

const onChangeTab = async (obj) => {
  if (obj.i === 1) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(async () => {
      eSendEvent(eCloseSideMenu);
      if (getIntent()) return;
      await sleep(150);
      if (!editing.currentlyEditing || !getNote()) {
        console.log('i am called before', getIntent());
        eSendEvent(eOnLoadNote, {type: 'new'});
      }
    }, 150);
  } else {
    if (obj.from === 1) {
      post('blur');
      await sleep(150);
      eSendEvent(eOpenSideMenu);
    }
  }
};

const MobileStack = React.memo(
  () => {
    useEffect(() => {
      console.log('rerendering mobile stack');
    });

    return (
      <ScrollableTabView
        ref={tabBarRef}
        prerenderingSiblingsNumber={Infinity}
        onChangeTab={onChangeTab}
        renderTabBar={() => <></>}>
        <NavigatorStack />
        <EditorWrapper />
      </ScrollableTabView>
    );
  },
  () => true,
);
