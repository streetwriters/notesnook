import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {getElevation} from '../../utils';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';

let contextTimeout = null;

const ContextMenu = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [contextMenu, setContextMenu] = useState({
    location: {
      x: -100,
      y: -100,
    },
    title: 'World',
  });

  const showContextMenu = async (event) => {
    if (contextTimeout) {
      clearTimeout(contextTimeout);
      contextTimeout = null;
    }
    setContextMenu(event);
    contextTimeout = setTimeout(() => {
      setContextMenu({
        location: {
          x: -100,
          y: -100,
        },
        title: 'World',
      });
    }, 2000);
  };

  useEffect(() => {
    eSubscribeEvent('showContextMenu', showContextMenu);

    return () => {
      eUnSubscribeEvent('showContextMenu', showContextMenu);
    };
  }, []);

  return (
    <View
      style={{
        ...getElevation(5),
        position: 'absolute',
        left: contextMenu.location.x,
        top: contextMenu.location.y,
        backgroundColor: colors.night ? colors.nav : 'black',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
      }}>
      <Paragraph color="white">{contextMenu.title}</Paragraph>
    </View>
  );
};

export default ContextMenu;
