import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../stores/theme';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { editing } from '../../utils';
import { eCloseProgressDialog, eOpenProgressDialog } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { EditorWebView } from '../../screens/editor/Functions';
import tiny from '../../screens/editor/tiny/tiny';
import { reFocusEditor } from '../../screens/editor/tiny/toolbar/constants';
import { Button } from '../ui/button';
import SheetWrapper from '../ui/sheet';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

const SheetProvider = ({ context = 'global' }) => {
  const colors = useThemeStore(state => state.colors);
  const [visible, setVisible] = useState(false);
  const [dialogData, setDialogData] = useState(null);
  const actionSheetRef = useRef();
  const editor = useRef({
    refocus: false
  });

  useEffect(() => {
    eSubscribeEvent(eOpenProgressDialog, open);
    eSubscribeEvent(eCloseProgressDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenProgressDialog, open);
      eUnSubscribeEvent(eCloseProgressDialog, close);
    };
  }, [visible]);

  const open = async data => {
    if (!data.context) data.context = 'global';
    if (data.context !== context) return;
    if (visible || dialogData) {
      setDialogData(null);
      setVisible(false);
      await sleep(500);
    }
    setDialogData(data);
    setVisible(true);
    if (data.editor) {
      editor.current.refocus = false;
      if (editing.keyboardState) {
        tiny.call(EditorWebView, tiny.cacheRange);
        tiny.call(EditorWebView, tiny.blur);
        editor.current.refocus = true;
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (visible && dialogData) {
        if (dialogData.editor) await sleep(100);
        actionSheetRef.current?.setModalVisible(true);
        return;
      } else {
        if (editor.current.refocus) {
          editing.isFocused = true;
          await reFocusEditor();
          tiny.call(EditorWebView, tiny.restoreRange);
          tiny.call(EditorWebView, tiny.clearRange);
          editor.current.refocus = false;
        }
      }
    })();
  }, [visible, dialogData]);

  const close = ctx => {
    if ((ctx && !context) || (ctx && ctx !== context)) {
      return;
    }
    actionSheetRef.current?.setModalVisible(false);
  };

  return !visible || !dialogData ? null : (
    <SheetWrapper
      fwdRef={actionSheetRef}
      gestureEnabled={!dialogData?.progress && !dialogData?.disableClosing}
      closeOnTouchBackdrop={!dialogData?.progress && !dialogData?.disableClosing}
      onClose={() => {
        dialogData.onClose && dialogData.onClose();
        setVisible(false);
        setDialogData(null);
      }}
    >
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom:
            !dialogData.progress && !dialogData.icon && !dialogData.title && !dialogData.paragraph
              ? 0
              : 10,
          paddingHorizontal: 12
        }}
      >
        {dialogData?.progress ? (
          <ActivityIndicator
            style={{
              marginTop: 15
            }}
            size={50}
            color={colors.accent}
          />
        ) : null}

        {dialogData?.icon ? (
          <Icon
            color={colors[dialogData.iconColor] || colors.accent}
            name={dialogData.icon}
            size={50}
          />
        ) : null}

        {dialogData?.title ? <Heading> {dialogData?.title}</Heading> : null}

        {dialogData?.paragraph ? (
          <Paragraph style={{ textAlign: 'center' }}>{dialogData?.paragraph}</Paragraph>
        ) : null}
      </View>

      {typeof dialogData.component === 'function'
        ? dialogData.component(actionSheetRef, close)
        : dialogData.component}

      <View
        style={{
          paddingHorizontal: 12,
          marginBottom: dialogData.valueArray ? 12 : 0
        }}
      >
        {dialogData.valueArray &&
          dialogData.valueArray.map(v => (
            <Button
              title={v}
              type="gray"
              key={v}
              textStyle={{ fontWeight: 'normal' }}
              fontSize={SIZE.sm}
              icon="check"
              width="100%"
              style={{
                justifyContent: 'flex-start',
                backgroundColor: 'transparent'
              }}
            />
          ))}
      </View>

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        {dialogData?.action ? (
          <Button
            onPress={dialogData.action}
            key={dialogData.actionText}
            title={dialogData.actionText}
            accentColor={dialogData.iconColor || 'accent'}
            accentText="light"
            type="accent"
            height={50}
            width="100%"
            fontSize={SIZE.md}
          />
        ) : null}

        {dialogData?.actionsArray &&
          dialogData?.actionsArray.map((item, index) => (
            <Button
              onPress={item.action}
              key={item.accentText}
              title={item.actionText}
              icon={item.icon && item.icon}
              type={item.type || 'accent'}
              height={50}
              style={{
                marginBottom: 10
              }}
              width="100%"
              fontSize={SIZE.md}
            />
          ))}

        {dialogData?.learnMore ? (
          <Paragraph
            style={{
              alignSelf: 'center',
              marginTop: 10,
              textDecorationLine: 'underline'
            }}
            size={SIZE.xs}
            onPress={dialogData.learnMorePress}
            color={colors.icon}
          >
            <Icon color={colors.icon} name="information-outline" size={SIZE.xs} />{' '}
            {dialogData.learnMore}
          </Paragraph>
        ) : null}
      </View>
    </SheetWrapper>
  );
};

export default SheetProvider;
