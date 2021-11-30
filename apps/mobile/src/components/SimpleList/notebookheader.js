import React, {useState} from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {useMenuStore} from '../../provider/stores';
import {ToastEvent} from '../../services/EventManager';
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
            name="link-variant"
            onPress={onPinNotebook}
            customStyle={{
              marginRight: 15,
              width:40,
              height:40
            }}
            type={isPinnedToMenu ?  "transparent" : "grayBg"}
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
              width:40,
              height:40
            }}
          />
        </View>
      </View>

      {notebook.description && (
        <Paragraph size={SIZE.md} color={colors.pri}>
          {notebook.description}
        </Paragraph>
      )}
      {/*   <View
        style={{
          marginTop: 15,
          flexDirection: 'row'
        }}>
        <Button
          title="Edit notebook"
          width={null}
          height={null}
          type="transparent"
          icon="pencil"
          fontSize={SIZE.sm}
          onPress={onEditNotebook}
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            borderRadius: 100,
            height: 30,
            marginRight: 10
          }}
        />

        <Button
          width={null}
          height={null}
          type={isPinnedToMenu ? 'shade' : 'transparent'}
          icon="link-variant"
          onPress={onPinNotebook}
          style={{
            alignSelf: 'flex-start',
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: 30,
            height: 30,
            borderColor: isPinnedToMenu ? colors.accent : colors.icon,
            marginRight: 10
          }}
        />
      </View> */}

      <Paragraph
        style={{
          marginTop: 10,
          fontStyle: 'italic'
        }}
        size={SIZE.xs + 1}
        color={colors.icon}>
        {notebook.topics.length === 1
          ? '1 topic'
          : `${notebook.topics.length} topics`}
        , last modified on {new Date(notebook.dateEdited).toLocaleString()}
      </Paragraph>
    </View>
  );
};
