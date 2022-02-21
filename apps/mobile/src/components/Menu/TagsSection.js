import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { useMenuStore, useNoteStore } from '../../provider/stores';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { db } from '../../utils/database';
import { eOnNewTopicAdded, refreshNotesPage } from '../../utils/Events';
import { normalize, SIZE } from '../../utils/SizeUtils';
import { Button } from '../Button';
import { Notice } from '../Notice';
import { PressableButton } from '../PressableButton';
import { Properties } from '../Properties';
import Seperator from '../Seperator';
import SheetWrapper from '../Sheet';
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
    let params = {};
    if (item.type === 'notebook') {
      params = {
        notebook: item,
        title: item.title,
        menu: true
      };
      eSendEvent(eOnNewTopicAdded, params);
      Navigation.navigate('Notebook', params, {
        heading: item.title,
        id: item.id,
        type: item.type
      });
    } else if (item.type === 'tag') {
      params = {
        ...item,
        type: 'tag',
        menu: true,
        get: 'tagged'
      };
      eSendEvent(refreshNotesPage, params);
      Navigation.navigate('NotesPage', params, {
        heading: '#' + db.tags.alias(item.id),
        id: item.id,
        type: item.type
      });
    } else {
      params = { ...item, menu: true, get: 'topics' };
      eSendEvent(refreshNotesPage, params);
      Navigation.navigate('NotesPage', params, {
        heading: item.title,
        id: item.id,
        type: item.type
      });
    }
    Navigation.closeDrawer();
  };

  const renderItem = ({ item, index }) => {
    let alias = item.type === 'tag' ? db.tags.alias(item.title) : item.title;
    return <PinItem item={item} index={index} alias={alias} onPress={onPress} />;
  };

  return (
    <View
      style={{
        flexGrow: 1
      }}
    >
      <FlatList
        data={menuPins}
        style={{
          flexGrow: 1
        }}
        ListEmptyComponent={
          <Notice
            size="small"
            type="information"
            text="Add shortcuts for notebooks, topics and tags here."
          />
        }
        contentContainerStyle={{
          flexGrow: 1
        }}
        keyExtractor={(item, index) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

export const PinItem = React.memo(
  ({ item, index, onPress, placeholder, alias }) => {
    const [state] = useTracked();
    const { colors } = state;
    const setMenuPins = useMenuStore(state => state.setMenuPins);
    alias = item.type === 'tag' ? db.tags.alias(item.title) : item.title;
    const [visible, setVisible] = useState(false);
    const [headerTextState, setHeaderTextState] = useState(null);
    const color = headerTextState?.id === item.id ? colors.accent : colors.pri;
    const fwdRef = useRef();

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

    const icons = {
      topic: 'bookmark',
      notebook: 'book-outline',
      tag: 'pound'
    };

    return (
      <>
        {visible && (
          <SheetWrapper
            onClose={() => {
              setVisible(false);
            }}
            gestureEnabled={false}
            fwdRef={fwdRef}
            visible={true}
          >
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
          </SheetWrapper>
        )}
        <PressableButton
          type={headerTextState?.id === item.id ? 'grayBg' : 'gray'}
          onLongPress={() => {
            if (placeholder) return;
            Properties.present(item);
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
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexGrow: 1,
              flex: 1
            }}
          >
            <View
              style={{
                width: 30,
                justifyContent: 'center'
              }}
            >
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
              }}
            >
              {headerTextState?.id === item.id ? (
                <Heading
                  style={{
                    flexWrap: 'wrap'
                  }}
                  color={colors.heading}
                  size={SIZE.md}
                >
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
  },
  (prev, next) => {
    if (prev.alias !== next.alias) return false;
    if (prev.item?.dateModified !== next.item?.dateModified) return false;
    if (prev.item?.id !== next.item?.id) return false;
    return true;
  }
);
