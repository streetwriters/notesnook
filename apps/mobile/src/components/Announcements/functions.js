import React from 'react';
import {View} from 'react-native';
import {allowedPlatforms} from '../../provider/stores';
import {ProFeatures} from '../ResultDialog/pro-features';
import {Body} from './body';
import {Cta} from './cta';
import {Description} from './description';
import {List} from './list';
import {Photo} from './photo';
import {SubHeading} from './subheading';
import {Title} from './title';

export function allowedOnPlatform(platforms) {
  if (!platforms) return true;
  return platforms.some(platform => allowedPlatforms.indexOf(platform) > -1);
}

export const margins = {
  0: 0,
  1: 12,
  2: 20
};

export const getStyle = style => {
  if (!style) return {};
  return {
    marginTop: margins[style.marginTop] || 0,
    marginBottom: margins[style.marginBottom] || 0,
    textAlign: style.textAlign || 'left'
  };
};

const Features = () => {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        alignItems: 'center',
        width: '100%'
      }}>
      <ProFeatures />
    </View>
  );
};

const renderItems = {
  title: Title,
  description: Description,
  body: Body,
  image: Photo,
  list: List,
  subheading: SubHeading,
  features: Features,
  callToActions: Cta
};

export const renderItem = ({item, index, color,inline}) => {
  const Item = renderItems[item.type];

  return <Item key={item.text || item.src || item.type} {...item} index={index} color={color} inline={inline} />;
};
