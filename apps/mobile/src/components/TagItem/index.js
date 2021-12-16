import React, {useEffect} from 'react';
import {useWindowDimensions, View} from 'react-native';
import {notesnook} from '../../../e2e/test.ids';
import {PressableButton} from '../../components/PressableButton';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/database';
import {refreshNotesPage} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {ActionSheetEvent} from '../DialogManager/recievers';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const TagItem = React.memo(
  ({item, index}) => {
    const [state] = useTracked();
    const {colors} = state;
    const {fontScale} = useWindowDimensions();
    const onPress = () => {
      let params = {
        ...item,
        type: 'tag',
        get: 'tagged'
      };

      eSendEvent(refreshNotesPage, params);
      Navigation.navigate('NotesPage', params, {
        heading: '#' + item.title,
        id: item.id,
        type: item.type
      });
    };

    return (
      <PressableButton
        onPress={onPress}
        selectedColor={colors.nav}
        testID={notesnook.ids.tag.get(index)}
        alpha={!colors.night ? -0.02 : 0.02}
        opacity={1}
        customStyle={{
          paddingHorizontal: 12,
          height: 80 * fontScale,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1.5,
          borderBottomColor: colors.nav,
          width: '100%',
          justifyContent: 'space-between'
        }}>
        <View
          style={{
            maxWidth: '92%'
          }}>
          <Heading size={SIZE.md}>
            <Heading
              size={SIZE.md}
              style={{
                color: colors.accent
              }}>
              #
            </Heading>
            {db.tags.alias(item.id)}
          </Heading>
          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={{
              marginTop: 5
            }}>
            {item && item.noteIds.length && item.noteIds.length > 1
              ? item.noteIds.length + ' notes'
              : item.noteIds.length === 1
              ? item.noteIds.length + ' note'
              : null}
          </Paragraph>
        </View>

        <ActionIcon
          color={colors.heading}
          name="dots-horizontal"
          size={SIZE.xl}
          onPress={() => {
            let rowItems = ['Add Shortcut', 'Delete', 'Rename Tag'];
            ActionSheetEvent(item, false, false, rowItems);
          }}
          testID={notesnook.ids.tag.menu}
          customStyle={{
            justifyContent: 'center',
            height: 35,
            width: 35,
            borderRadius: 100,
            alignItems: 'center'
          }}
        />
      </PressableButton>
    );
  },
  (prev, next) => {
    if (prev.item?.dateEdited !== next.item?.dateEdited) {
      return false;
    }
    if (JSON.stringify(prev.item) !== JSON.stringify(next.item)) {
      return false;
    }

    return true;
  }
);

export default TagItem;
