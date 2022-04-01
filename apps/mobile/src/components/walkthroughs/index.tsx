import React, { useState } from 'react';
import { LayoutAnimation, View } from 'react-native';
import { useThemeStore } from '../../stores/theme';
import { eSendEvent, presentSheet } from '../../services/event-manager';
import { eCloseProgressDialog } from '../../utils/events';
import { MMKV } from '../../utils/database/mmkv';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { Button } from '../ui/button';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
import walkthroughs, { TStep } from './walkthroughs';

export const Walkthrough = ({ steps, canSkip = true }: { steps: TStep[]; canSkip: boolean }) => {
  const colors = useThemeStore(state => state.colors);
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
      {step.walkthroughItem(colors)}

      {step.title ? <Heading>{step.title}</Heading> : null}
      {step.text ? (
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
      ) : null}
      {step.actionButton && (
        <Button
          //@ts-ignore
          style={{
            height: 30,
            marginTop: 10
          }}
          textStyle={{
            textDecorationLine: 'underline'
          }}
          onPress={async () => {
            step.actionButton?.action();
          }}
          type="transparent"
          title={step.actionButton.text}
        />
      )}

      <Button
        //@ts-ignore
        style={{
          borderRadius: 100,
          height: 40,
          marginTop: 20
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

      {canSkip ? (
        <Button
          //@ts-ignore
          style={{
            height: 30,
            marginTop: 10
          }}
          textStyle={{
            textDecorationLine: 'underline'
          }}
          onPress={async () => {
            eSendEvent(eCloseProgressDialog);
          }}
          type="gray"
          title="Skip introduction"
        />
      ) : null}
    </View>
  );
};
let walkthroughState: { [name: string]: boolean } = {};

Walkthrough.update = async (id: 'notebooks' | 'trialstarted' | 'emailconfirmed' | 'prouser') => {
  console.log('walkthrough state', walkthroughState);
  if (walkthroughState[id]) return;
  walkthroughState[id] = true;
  MMKV.setItem('walkthroughState', JSON.stringify(walkthroughState));
};

Walkthrough.init = async () => {
  let json = await MMKV.getItem('walkthroughState');
  if (json) {
    walkthroughState = JSON.parse(json);
    console.log(walkthroughState);
  }
};

Walkthrough.present = async (
  id: 'notebooks' | 'trialstarted' | 'emailconfirmed' | 'prouser',
  canSkip = true,
  nopersist?: boolean
) => {
  if (!nopersist) {
    if (!walkthroughState || Object.keys(walkthroughState).length === 0) {
      console.log('late init of walkthrough state');
      await Walkthrough.init();
    }
    if (walkthroughState[id]) return;
    //@ts-ignore
    Walkthrough.update(id);
  }

  //@ts-ignore
  let walkthrough = walkthroughs[id];
  if (!walkthrough) return;
  presentSheet({
    component: <Walkthrough canSkip={canSkip} steps={walkthrough.steps} />,
    disableClosing: true
  });
};
