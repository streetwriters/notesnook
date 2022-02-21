import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { useMenuStore, useNoteStore } from '../../provider/stores';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { COLORS_NOTE } from '../../utils/Colors';
import { db } from '../../utils/database';
import { refreshNotesPage } from '../../utils/Events';
import { normalize, SIZE } from '../../utils/SizeUtils';
import { presentDialog } from '../Dialog/functions';
import { PressableButton } from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const ColorSection = () => {
  const colorNotes = useMenuStore(state => state.colorNotes);
  const loading = useNoteStore(state => state.loading);
  const setColorNotes = useMenuStore(state => state.setColorNotes);

  useEffect(() => {
    if (!loading) {
      setColorNotes();
    }
  }, [loading]);

  return colorNotes.map((item, index) => {
    let alias = db.colors.alias(item.id);
    return <ColorItem key={item.id} alias={alias} item={item} index={index} />;
  });
};

const ColorItem = React.memo(
  ({ item, index, alias }) => {
    const [state] = useTracked();
    const { colors } = state;
    const setColorNotes = useMenuStore(state => state.setColorNotes);
    const [headerTextState, setHeaderTextState] = useState(null);
    alias = db.colors.alias(item.id);

    const onHeaderStateChange = event => {
      setTimeout(() => {
        if (event.id === item.id) {
          setHeaderTextState(event);
        } else {
          if (headerTextState !== null) {
            setHeaderTextState(null);
          }
        }
      }, 300);
    };

    useEffect(() => {
      eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
      return () => {
        eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
      };
    }, [headerTextState]);

    const onPress = item => {
      let params = {
        ...item,
        type: 'color',
        menu: true,
        get: 'colored'
      };

      eSendEvent(refreshNotesPage, params);
      Navigation.navigate('NotesPage', params, {
        heading: alias.slice(0, 1).toUpperCase() + alias.slice(1),
        id: item.id,
        type: 'color'
      });
      Navigation.closeDrawer();
    };

    const onLongPress = () => {
      presentDialog({
        title: 'Rename color',
        input: true,
        inputPlaceholder: 'Enter name for this color',
        defaultValue: alias,
        paragraph: 'You are renaming the color ' + item.title,
        positivePress: async value => {
          if (!value || value.trim().length === 0) return;
          await db.colors.rename(item.id, value);
          setColorNotes();
          console.log('color updated');
        },
        positiveText: 'Rename'
      });
    };

    return (
      <PressableButton
        customColor={headerTextState?.id === item.id ? 'rgba(0,0,0,0.04)' : 'transparent'}
        onLongPress={onLongPress}
        customSelectedColor={COLORS_NOTE[item.title.toLowerCase()]}
        customAlpha={!colors.night ? -0.02 : 0.02}
        customOpacity={0.12}
        onPress={() => onPress(item)}
        customStyle={{
          width: '100%',
          alignSelf: 'center',
          borderRadius: 5,
          flexDirection: 'row',
          paddingHorizontal: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
          height: normalize(50),
          marginBottom: 5
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <View
            style={{
              width: 30,
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}
          >
            <View
              style={{
                width: SIZE.lg - 2,
                height: SIZE.lg - 2,
                backgroundColor: COLORS_NOTE[item.title.toLowerCase()],
                borderRadius: 100,
                justifyContent: 'center',
                marginRight: 10
              }}
            />
          </View>
          {headerTextState?.id === item.id ? (
            <Heading color={colors.heading} size={SIZE.md}>
              {alias.slice(0, 1).toUpperCase() + alias.slice(1)}
            </Heading>
          ) : (
            <Paragraph color={colors.pri} size={SIZE.md}>
              {alias.slice(0, 1).toUpperCase() + alias.slice(1)}
            </Paragraph>
          )}
        </View>
      </PressableButton>
    );
  },
  (prev, next) => {
    if (prev.item?.dateModified !== next.item?.dateModified) return false;
    if (prev.alias !== next.alias) return false;
    if (prev.item?.id !== next.item?.id) return false;

    return true;
  }
);
