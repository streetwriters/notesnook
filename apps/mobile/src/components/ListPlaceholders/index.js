import React, { useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  FAV_SVG,
  LOGIN_SVG,
  LOGO_SVG,
  NOTEBOOK_SVG,
  NOTE_SVG,
  SEARCH_SVG,
  SETTINGS_SVG,
  TAG_SVG,
  TOPIC_SVG,
  TRASH_SVG
} from '../../assets/images/assets';
import { useTracked } from '../../provider';
export const Placeholder = ({ type, w, h, color }) => {
  const [state, dispatch] = useTracked();
  const { colors } = state;
  const getSVG = () => {
    switch (type) {
      case 'notes':
        return NOTE_SVG(color || colors.accent);
      case 'notebooks':
        return NOTEBOOK_SVG(colors.accent);
      case 'topics':
        return TOPIC_SVG(colors.accent);
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
    <SvgToPngView
      color={type === 'notes' ? color || colors.accent : colors.accent}
      src={getSVG()}
      img={type}
      width={w}
      height={h}
    />
  );
};

export const SvgToPngView = ({ width, height, src, color, img }) => {
  const [error, setError] = useState(false);

  return (
    <View
      style={{
        height: width || 250,
        width: height || 250
      }}
    >
      <SvgXml xml={src} width="100%" height="100%" />
    </View>
  );
};
