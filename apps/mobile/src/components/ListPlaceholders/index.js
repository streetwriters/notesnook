import React from 'react';
import {View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {
  NOTE_SVG,
  NOTEBOOK_SVG,
  TAG_SVG,
  FAV_SVG,
  TRASH_SVG,
} from '../../assets/images/assets';
import { useTracked } from '../../provider';
export const Placeholder = ({type}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const getSVG = () => {
    switch (type) {
      case 'notes':
        return NOTE_SVG(colors.accent);
      case 'notebooks':
        return NOTEBOOK_SVG(colors.accent);
      case 'tags':
        return TAG_SVG(colors.accent);
      case 'favorites':
        return FAV_SVG(colors.accent);
      case 'trash':
        return TRASH_SVG(colors.accent);
    }
  };

  return (
    <View
      style={{
        height: 250,
        width: 250,
      }}>
      <SvgXml xml={getSVG()} width="100%" height="100%" />
    </View>
  );
};
