import React from 'react';
import {View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {
  NOTE_SVG,
  NOTEBOOK_SVG,
  TAG_SVG,
  FAV_SVG,
  TRASH_SVG,
  SETTINGS_SVG,
  SEARCH_SVG,
  LOGIN_SVG,
  LOGO_SVG,
} from '../../assets/images/assets';
import {useTracked} from '../../provider';
export const Placeholder = ({type, w, h, color}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const getSVG = () => {
    switch (type) {
      case 'notes':
        return NOTE_SVG(color || colors.accent);
      case 'notebooks':
        return NOTEBOOK_SVG(colors.accent);
      case 'topics':
        return NOTEBOOK_SVG(colors.accent);
      case 'tags':
        return TAG_SVG(colors.accent);
      case 'favorites':
        return FAV_SVG(colors.accent);
      case 'trash':
        return TRASH_SVG(colors.accent);
      case 'settings':
        return SETTINGS_SVG(colors.accent);
      case 'search':
        return SEARCH_SVG(colors.accent);
      case 'login':
        return LOGIN_SVG(colors.accent);
      case 'signup':
        return LOGO_SVG;
    }
  };

  return (
    <View
      style={{
        height: w || 250,
        width: h || 250,
      }}>
      <SvgXml xml={getSVG()} width="100%" height="100%" />
    </View>
  );
};
