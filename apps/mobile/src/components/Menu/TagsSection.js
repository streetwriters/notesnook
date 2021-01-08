import React, {useEffect, useState} from 'react';
import {FlatList, InteractionManager, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {getElevation} from '../../utils';
import {db} from '../../utils/DB';
import {refreshNotesPage} from '../../utils/Events';
import {rootNavigatorRef} from '../../utils/Refs';
import {normalize, ph, pv, SIZE} from '../../utils/SizeUtils';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogHeader from '../Dialog/dialog-header';
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
      rootNavigatorRef.current?.setParams(params);
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
        ListEmptyComponent={
          <View
            style={{
              flexGrow: 1,
              minHeight: '40%',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: '10%',
            }}>
            <Heading style={{marginBottom: 2.5}} size={SIZE.sm}>
              Shortcuts
            </Heading>
            <Paragraph
              style={{textAlign: 'center'}}
              color={colors.icon}
              size={SIZE.xs}>
              You can add shortcuts to notebooks, topics and tags here.
            </Paragraph>
          </View>
        }
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
  return (
    <>
      {visible && (
        <BaseDialog visible={true}>
          <View
            style={{
              ...getElevation(5),
              width: DDS.isTab ? 350 : '80%',
              maxHeight: 350,
              borderRadius: 5,
              backgroundColor: colors.bg,
              paddingHorizontal: ph,
              paddingVertical: pv,
            }}>
            <DialogHeader title="Remove Shortcut" paragraph={`Remove this ${item.type} from menu`} />
            <DialogButtons
              positiveTitle="Remove"
              negativeTitle="Cancel"
              onPressNegative={() => setVisible(false)}
              onPressPositive={async () => {
                await db.settings.unpin(item.id);
                dispatch({type: Actions.MENU_PINS});
              }}
            />
          </View>
        </BaseDialog>
      )}
      <PressableButton
        type="transparent"
        onLongPress={() => setVisible(true)}
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
          }}>
          <View
            style={{
              width: 30,
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
            {item.type === 'notebook' ? (
              <Icon color={color} size={SIZE.md} name="book-outline" />
            ) : item.type === 'tag' ? (
              <Icon color={color} size={SIZE.md} name="pound" />
            ) : (
              <Heading
                style={{textAlign: 'center', width: 12}}
                color={color}
                size={SIZE.md}>
                T
              </Heading>
            )}
          </View>
          <View
            style={{
              alignItems: 'flex-start',
              width: '75%',
            }}>
            {headerTextState?.id === item.id ? (
              <Heading
                style={{
                  flexWrap: 'wrap',
                }}
                color={colors.heading}
                size={SIZE.md}>
                {item.title}
              </Heading>
            ) : (
              <Paragraph
                style={{
                  flexWrap: 'wrap',
                }}
                color={colors.heading}
                size={SIZE.md}>
                {item.title}
              </Paragraph>
            )}
            <Paragraph
              style={{marginTop: 2.5}}
              size={SIZE.xs}
              color={colors.icon}>
              {item.type.slice(0, 1).toUpperCase() +
                item.type.slice(1, item.type.length)}{' '}
              {item.type === 'topic'
                ? 'in ' + db.notebooks.notebook(item.notebookId).data.title
                : null}
            </Paragraph>
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
