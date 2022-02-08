import React, { useState } from 'react';
import { Image, LayoutAnimation, View } from 'react-native';
import { eSendEvent, presentSheet } from '../../services/EventManager';
import { eCloseProgressDialog } from '../../utils/Events';
import { MMKV } from '../../utils/mmkv';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import { Button } from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import walkthroughs, { TStep } from './walkthroughs';

export const Walkthrough = ({ steps }: { steps: TStep[] }) => {
  const [step, setStep] = useState<TStep>(steps && steps[0]);

  const next = () => {
    let index = steps.findIndex(s => s.text === step.text);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(steps[index + 1]);
  };

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 0
      }}
    >
      <Image
        source={{ uri: step.image }}
        style={{
          width: '100%',
          height: 200,
          borderRadius: 10,
          alignSelf: 'center',
          marginBottom: 10
        }}
      />
      <Heading>{step.title}</Heading>
      <Paragraph
        style={{
          textAlign: 'center',
          alignSelf: 'center',
          maxWidth: '80%'
        }}
        size={SIZE.md}
      >
        {step.text}
      </Paragraph>

      <Button
        //@ts-ignore
        style={{
          borderRadius: 100,
          height: 40,
          marginTop: 10
        }}
        onPress={async () => {
          switch (step.button?.type) {
            case 'next':
              next();
              return;
            case 'done':
              eSendEvent(eCloseProgressDialog);
              await sleep(300);
              step.button?.action && step.button.action();
              return;
          }
        }}
        width={250}
        title={step.button?.title}
        type="accent"
      />

      <Button
        //@ts-ignore
        style={{
          borderRadius: 100,
          height: 40,
          marginTop: 10
        }}
        onPress={async () => {
          eSendEvent(eCloseProgressDialog);
        }}
        width={250}
        title="Skip"
        type="grayBg"
      />
    </View>
  );
};

Walkthrough.present = async (id: 'notebooks') => {
  let walkthroughState = await MMKV.getItem('walkthroughState');
  if (walkthroughState) {
    walkthroughState = JSON.parse(walkthroughState);
  } else {
    //@ts-ignore
    walkthroughState = {};
  }
  //@ts-ignore
  if (walkthroughState[id]) return;
  //@ts-ignore
  walkthroughState[id] = true;
  //MMKV.setItem('walkthroughState', JSON.stringify(walkthroughState));
  //@ts-ignore
  let walkthrough = walkthroughs[id];
  if (!walkthrough) return;
  presentSheet({
    component: <Walkthrough steps={walkthrough.steps} />,
    disableClosing: true
  });
};
