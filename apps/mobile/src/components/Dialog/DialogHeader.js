import React from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const DialogHeader = ({icon, title, paragraph, button}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 50,
        }}>
        <View>
          <Heading size={SIZE.xl}>{title}</Heading>
          {paragraph ? (
            <Paragraph color={colors.icon}>{paragraph}</Paragraph>
          ) : null}
        </View>

        {button && (
          <Button
            onPress={button.onPress}
            title={button.title}
            type="grayBg"
            fontSize={SIZE.md}
          />
        )}
      </View>
    </>
  );
};

export default DialogHeader;
