import React, {useEffect, useState} from 'react';
import {Image} from 'react-native';
import {View} from 'react-native';
import {SvgXml} from 'react-native-svg';
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
  TRASH_SVG,
} from '../../assets/images/assets';
import {useTracked} from '../../provider';
import FastImage from 'react-native-fast-image';
export const Placeholder = React.memo(
  ({type, w, h, color}) => {
    const [state, dispatch] = useTracked();
    const {colors} = state;
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
  },
  () => true,
);

export const SvgToPngView = ({width, height, src, color, img}) => {
  const [error, setError] = useState(false);

  return (
    <View
      style={{
        height: width || 250,
        width: height || 250,
      }}>
      {error ? (
        <SvgXml xml={src} width="100%" height="100%" />
      ) : (
        <FastImage
          style={{
            width: '100%',
            height: '100%',
          }}
          onError={() => {
            setError(true);
          }}
          source={{
            uri: `https://github.com/ammarahm-ed/notesnook/raw/main/assets/${img}-${color.replace(
              '#',
              '%23',
            )}.png`,
            cache: 'immutable',
            priority: 'high',
          }}
        />
      )}
    </View>
  );
};
