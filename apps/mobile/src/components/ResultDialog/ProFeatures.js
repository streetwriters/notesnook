import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { eSendEvent } from '../../services/EventManager';
import { eCloseProgressDialog, eCloseResultDialog, eOpenPremiumDialog } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import Paragraph from '../ui/typography/paragraph';
export const ProFeatures = ({ count = 6 }) => {
  const [state, dispatch] = useTracked();
  const { colors } = state;

  return (
    <>
      {[
        {
          content: 'Unlock unlimited notebooks, tags, colors. Organize like a pro'
        },
        {
          content: 'Attach files upto 500MB, upload 4K images with unlimited storage'
        },
        {
          content: 'Instantly sync to unlimited devices'
        },
        {
          content: 'A private vault to keep everything imporant always locked'
        },
        {
          content: 'Rich note editing experience with markdown, tables, checklists and more'
        },
        {
          content: 'Export your notes in Pdf, markdown and html formats'
        }
      ]
        .slice(0, count)
        .map(item => (
          <View
            key={item.content}
            style={{
              flexDirection: 'row',
              width: '100%',
              height: 40,
              paddingHorizontal: 0,
              marginBottom: 10,
              alignItems: 'center',
              borderRadius: 5,
              justifyContent: 'flex-start'
            }}
          >
            <Icon size={SIZE.lg} color={colors.accent} name="check" />
            <Paragraph style={{ marginLeft: 5, flexShrink: 1 }}>{item.content}</Paragraph>
          </View>
        ))}
      <Paragraph
        onPress={async () => {
          eSendEvent(eCloseResultDialog);
          eSendEvent(eCloseProgressDialog);
          await sleep(300);
          eSendEvent(eOpenPremiumDialog);
        }}
        size={SIZE.xs + 1}
        style={{
          textDecorationLine: 'underline',
          color: colors.icon
        }}
      >
        See all features included in Notesnook Pro
      </Paragraph>
    </>
  );
};
