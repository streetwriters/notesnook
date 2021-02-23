import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {getElevation} from '../../utils';
import {db} from '../../utils/DB';
import {eOnNewTopicAdded, refreshNotesPage} from '../../utils/Events';
import {normalize, SIZE} from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const TagsSection = () => {
  const [state, dispatch] = useTracked();
  const {colors, menuPins, loading} = state;

  useEffect(() => {
    if (!loading) {
      dispatch({type: Actions.MENU_PINS});
    }
  }, [loading]);

  const onPress = (item) => {
    let params;
    if (item.type === 'notebook') {
      params = {
        notebook: item,
        title: item.title,
        menu: true,
      };

      Navigation.navigate('Notebook', params, {
        heading: item.title,
        id: item.id,
        type: item.type,
      });
      eSendEvent(eOnNewTopicAdded, params);
    } else if (item.type === 'tag') {
      params = params = {
        title: item.title,
        tag: item,
        type: 'tag',
        menu: true,
      };
      Navigation.navigate('NotesPage', params, {
        heading: '#' + item.title,
        id: item.id,
        type: item.type,
      });
      eSendEvent(refreshNotesPage, params);
    } else {
      params = {...item, menu: true};
      Navigation.navigate('NotesPage', params, {
        heading: item.title,
        id: item.id,
        type: item.type,
      });
      eSendEvent(refreshNotesPage, params);
    }
    Navigation.closeDrawer();
  };

  return (
    <View
      style={{
        flexGrow: 1,
      }}>
      <FlatList
        data={menuPins}
        style={{
          flexGrow: 1,
        }}
        contentContainerStyle={{
          flexGrow: 1,
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
  const [visible, setVisible] = useState(false);
  const [headerTextState, setHeaderTextState] = useState(null);
  const color = headerTextState?.id === item.id ? colors.accent : colors.pri;
  const fwdRef = useRef();
  const onHeaderStateChange = (event) => {
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
    topic: 'format-title',
    notebook: 'book-outline',
    tag: 'pound',
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
          <Button
            title="Remove Shortcut"
            type="error"
            onPress={async () => {
              await db.settings.unpin(item.id);
              dispatch({type: Actions.MENU_PINS});
            }}
            fontSize={SIZE.md}
            width="95%"
            height={50}
            customStyle={{
              marginBottom: 30,
            }}
          />
        </ActionSheetWrapper>
      )}
      <PressableButton
        type="transparent"
        onLongPress={() => {
          setVisible(true);
          fwdRef.current?.show();
        }}
        onPress={() => onPress(item)}
        customStyle={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderRadius: 0,
          paddingHorizontal: 10,
          minHeight: normalize(50),
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGrow: 1,
            flex: 1,
          }}>
          <View
            style={{
              width: 30,
              justifyContent: 'center',
            }}>
            <Icon color={color} size={SIZE.lg - 2} name={icons[item.type]} />
            <Icon
              style={{
                position: 'absolute',
                bottom: -5,
                left: -6,
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
              flex: 1,
            }}>
            {headerTextState?.id === item.id ? (
              <Heading
                style={{
                  flexWrap: 'wrap',
                }}
                color={colors.accent}
                size={SIZE.md}>
                {item.title}
              </Heading>
            ) : (
              <Paragraph
                numberOfLines={1}
                color={colors.heading}
                size={SIZE.md}>
                {item.title}
              </Paragraph>
            )}
          </View>
        </View>

        <View
          style={{
            backgroundColor:
              headerTextState?.id === item.id ? colors.accent : 'transparent',
            width: 7,
            height: 7,
            borderRadius: 100,
            ...getElevation(
              headerTextState?.id === item.id + '_navigation' ? 1 : 0,
            ),
          }}
        />
      </PressableButton>
    </>
  );
};
