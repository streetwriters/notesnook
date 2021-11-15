import React from 'react';
import {Text, View} from 'react-native';
import {color} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import Seperator from '../Seperator';
import Paragraph from '../Typography/Paragraph';
import {ProTag} from './pro-tag';

export const FeatureBlock = ({highlight, content, icon, pro, proTagBg}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return (
    <View
      style={{
        height: 100,
        justifyContent: 'center',
        padding: 10,
        marginRight: 10,
        borderRadius: 5,
        minWidth: 100
      }}>
      <Icon color={colors.icon} name={icon} size={SIZE.xl} />
      <Paragraph size={SIZE.md}>
        <Text style={{color: colors.accent}}>{highlight}</Text>
        {'\n'}
        {content}
      </Paragraph>

      {pro ? (
        <>
          <View style={{height: 5}} />
          <ProTag width={50} size={SIZE.xs} background={proTagBg} />
        </>
      ) : (
        <View
          style={{
            width: 30,
            height: 3,
            marginTop: 10,
            borderRadius: 100,
            backgroundColor: colors.accent
          }}
        />
      )}
    </View>
  );
};
