import React, {useState} from 'react';
import {Platform, View} from 'react-native';
import {useTracked} from '../../provider';
import {useMenuStore} from '../../provider/stores';
import {ToastEvent} from '../../services/EventManager';
import {getTotalNotes} from '../../utils';
import {db} from '../../utils/database';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const NotebookHeader = ({notebook, onPress, onEditNotebook}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(
    db.settings.isPinned(notebook.id)
  );
  const setMenuPins = useMenuStore(state => state.setMenuPins);
  const totalNotes = getTotalNotes(notebook);

  const onPinNotebook = async () => {
    try {
      if (isPinnedToMenu) {
        await db.settings.unpin(notebook.id);
      } else {
        await db.settings.pin(notebook.type, {id: notebook.id});
        ToastEvent.show({
          heading: 'Shortcut created',
          type: 'success'
        });
      }
      setIsPinnedToMenu(db.settings.isPinned(notebook.id));
      setMenuPins();
    } catch (e) {}
  };

  return (
    <View
      style={{
        marginBottom: 5,
        padding: 0,
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 12,
        alignSelf: 'center',
        borderRadius: 10,
        paddingTop: 25
      }}>
      <Paragraph color={colors.icon} size={SIZE.xs}>
        {new Date(notebook.dateEdited).toLocaleString()}
      </Paragraph>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <Heading size={SIZE.xxl}>{notebook.title}</Heading>

        <View
          style={{
            flexDirection: 'row'
          }}>
          <ActionIcon
            name={isPinnedToMenu ? 'link-variant-off' : 'link-variant'}
            onPress={onPinNotebook}
            customStyle={{
              marginRight: 15,
              width: 40,
              height: 40
            }}
            type={isPinnedToMenu ? 'grayBg' : 'grayBg'}
            color={isPinnedToMenu ? colors.accent : colors.icon}
            size={SIZE.lg}
          />
          <ActionIcon
            size={SIZE.lg}
            onPress={onEditNotebook}
            name="pencil"
            type="grayBg"
            color={colors.icon}
            customStyle={{
              width: 40,
              height: 40
            }}
          />
        </View>
      </View>

      {notebook.description ? (
        <Paragraph size={SIZE.md} color={colors.pri}>
          {notebook.description}
        </Paragraph>
      ) : null}

      <Paragraph
        style={{
          marginTop: 10,
          fontStyle: 'italic',
          fontFamily: null
        }}
        size={SIZE.xs}
        color={colors.icon}>
        {notebook.topics.length === 1
          ? '1 topic'
          : `${notebook.topics.length} topics`}, {notebook && totalNotes > 1
          ? totalNotes + ' notes'
          : totalNotes === 1
          ? totalNotes + ' note'
          : '0 notes'}
      </Paragraph>
    </View>
  );
};
