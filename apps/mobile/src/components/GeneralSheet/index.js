import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {eCloseProgressDialog, eOpenProgressDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import SheetWrapper from '../sheet';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const GeneralSheet = ({context}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [dialogData, setDialogData] = useState({
    title: 'Loading',
    paragraph: 'Loading tagline'
  });
  const actionSheetRef = useRef();
  useEffect(() => {
    eSubscribeEvent(eOpenProgressDialog, open);
    eSubscribeEvent(eCloseProgressDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenProgressDialog, open);
      eUnSubscribeEvent(eCloseProgressDialog, close);
    };
  }, []);

  const open = async data => {
    if (
      (data.context && !context) ||
      (data.context && data.context !== context)
    ) {
      return;
    }
    setDialogData(data);
    setVisible(true);
    await sleep(1);
    actionSheetRef.current?.setModalVisible(true);
  };

  const close = ctx => {
    if ((ctx && !context) || (ctx && ctx !== context)) {
      return;
    }
    actionSheetRef.current?.setModalVisible(false);
  };

  return !visible ? null : (
    <SheetWrapper
      fwdRef={actionSheetRef}
      gestureEnabled={dialogData?.noProgress}
      closeOnTouchBackdrop={dialogData?.noProgress}
      onClose={() => {
        if (dialogData.noProgress) {
          setVisible(false);
          setDialogData(null);
        }
      }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom:
            dialogData.noProgress &&
            dialogData.noIcon &&
            !dialogData.title &&
            !dialogData.paragraph
              ? 0
              : 10,
          paddingHorizontal: 12
        }}>
        {!dialogData?.noProgress && !dialogData.component ? (
          <ActivityIndicator size={50} color={colors.accent} />
        ) : dialogData?.noIcon ? null : (
          <Icon
            color={colors[dialogData.iconColor] || colors.accent}
            name={dialogData.icon || 'check'}
            size={50}
          />
        )}

        {dialogData?.title ? <Heading> {dialogData?.title}</Heading> : null}

        {dialogData?.paragraph ? (
          <Paragraph style={{textAlign: 'center'}}>
            {dialogData?.paragraph}
          </Paragraph>
        ) : null}
      </View>

      {typeof dialogData.component === 'function'
        ? dialogData.component(actionSheetRef)
        : dialogData.component}

      {dialogData?.learnMore ? (
        <Paragraph
          style={{
            alignSelf: 'center'
          }}
          onPress={dialogData.learnMorePress}
          color={colors.icon}>
          <Icon color={colors.icon} name="information-outline" size={14} />{' '}
          {dialogData.learnMore}
        </Paragraph>
      ) : null}
      <View
        style={{
          paddingHorizontal: 12,
          marginBottom: dialogData.valueArray ? 12 : 0
        }}>
        {dialogData.valueArray &&
          dialogData.valueArray.map(v => (
            <Button
              title={v}
              type="gray"
              key={v}
              textStyle={{fontWeight: 'normal'}}
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
        }}>
        {dialogData?.action ? (
          <Button
            onPress={dialogData.action}
            key={dialogData.actionText}
            title={dialogData.actionText}
            accentColor={dialogData.iconColor || 'accent'}
            accentText="light"
            fontSize={SIZE.lg}
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
              type={item.type || "accent"}
              height={50}
              style={{
                marginBottom: 10
              }}
              width="100%"
              fontSize={SIZE.md}
            />
          ))}
      </View>
    </SheetWrapper>
  );
};

export default GeneralSheet;
