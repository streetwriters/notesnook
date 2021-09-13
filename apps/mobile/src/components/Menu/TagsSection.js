import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { useMenuStore, useNoteStore } from '../../provider/stores';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { db } from '../../utils/DB';
import { eOnNewTopicAdded, refreshNotesPage } from '../../utils/Events';
import { normalize, SIZE } from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import { Button } from '../Button';
import { PressableButton } from '../PressableButton';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const TagsSection = () => {
  const menuPins = useMenuStore(state => state.menuPins);
  const loading = useNoteStore(state => state.loading);
  const setMenuPins = useMenuStore(state => state.setMenuPins);

  useEffect(() => {
    if (!loading) {
      setMenuPins();
    }
  }, [loading]);

  const onPress = item => {
    let params;
    if (item.type === 'notebook') {
      params = {
        notebook: item,
        title: item.title,
        menu: true
      };

      Navigation.navigate('Notebook', params, {
        heading: item.title,
        id: item.id,
        type: item.type
      });
      eSendEvent(eOnNewTopicAdded, params);
    } else if (item.type === 'tag') {
      params = params = {
        ...item,
        type: 'tag',
        menu: true,
        get: 'tagged'
      };
      Navigation.navigate('NotesPage', params, {
        heading: '#' + db.tags.alias(item.id),
        id: item.id,
        type: item.type
      });
      eSendEvent(refreshNotesPage, params);
    } else {
      params = {...item, menu: true, get: 'topics'};
      Navigation.navigate('NotesPage', params, {
        heading: item.title,
        id: item.id,
        type: item.type
      });
      eSendEvent(refreshNotesPage, params);
    }
    Navigation.closeDrawer();
  };

  return (
    <View
      style={{
        flexGrow: 1
      }}>
      <FlatList
        data={menuPins}
        style={{
          flexGrow: 1
        }}
        contentContainerStyle={{
          flexGrow: 1
        }}
        keyExtractor={(item, index) => item.id}
        renderItem={({item, index}) => (
          <PinItem item={item} index={index} onPress={onPress} />
        )}
      />
    </View>
  );
};

const PinItem = ({item, index, onPress}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const setMenuPins = useMenuStore(state => state.setMenuPins);
  const alias = item.type === 'tag' ? db.tags.alias(item.title) : item.title;
  const [visible, setVisible] = useState(false);
  const [headerTextState, setHeaderTextState] = useState(null);
  const color = headerTextState?.id === item.id ? colors.accent : colors.pri;
  const fwdRef = useRef();

  const onHeaderStateChange = event => {
    if (event?.id === item.id) {
      setHeaderTextState(event);
    } else {
      setHeaderTextState(null);
    }
  };

  useEffect(() => {
    eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    return () => {
      eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    };
  }, []);

  const icons = {
    topic: 'book-open-outline',
    notebook: 'book-outline',
    tag: 'pound'
  };

  return (
    <>
      {visible && (
        <ActionSheetWrapper
          onClose={() => {
            setVisible(false);
          }}
          gestureEnabled={false}
          fwdRef={fwdRef}
          visible={true}>
          <Seperator />
          <Button
            title="Remove Shortcut"
            type="error"
            onPress={async () => {
              await db.settings.unpin(item.id);
              setVisible(false);
              setMenuPins();
            }}
            fontSize={SIZE.md}
            width="95%"
            height={50}
            customStyle={{
              marginBottom: 30
            }}
          />
        </ActionSheetWrapper>
      )}
      <PressableButton
        type={headerTextState?.id === item.id ? 'grayBg' : 'gray'}
        onLongPress={() => {
          setVisible(!visible);
          fwdRef.current?.show();
        }}
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
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGrow: 1,
            flex: 1
          }}>
          <View
            style={{
              width: 30,
              justifyContent: 'center'
            }}>
            <Icon color={color} size={SIZE.lg - 2} name={icons[item.type]} />
            <Icon
              style={{
                position: 'absolute',
                bottom: -6,
                left: -6
              }}
              color={color}
              size={SIZE.xs}
              name="arrow-top-right-thick"
            />
          </View>
          <View
            style={{
              alignItems: 'flex-start',
              flexGrow: 1,
              flex: 1
            }}>
            {headerTextState?.id === item.id ? (
              <Heading
                style={{
                  flexWrap: 'wrap'
                }}
                color={colors.heading}
                size={SIZE.md}>
                {alias}
              </Heading>
            ) : (
              <Paragraph numberOfLines={1} color={colors.pri} size={SIZE.md}>
                {alias}
              </Paragraph>
            )}
          </View>
        </View>
      </PressableButton>
    </>
  );
};
