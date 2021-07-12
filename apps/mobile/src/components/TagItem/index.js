import React from 'react';
import {useWindowDimensions, View} from 'react-native';
import {notesnook} from '../../../e2e/test.ids';
import {PressableButton} from '../../components/PressableButton';
import {useTracked} from '../../provider';
import Navigation from '../../services/Navigation';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {ActionSheetEvent} from '../DialogManager/recievers';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const TagItem = ({item, index}) => {
  const [state] = useTracked();
  const {colors} = state;
  const {fontScale} = useWindowDimensions();
  const onPress = () => {
    Navigation.navigate(
      'NotesPage',
      {
        ...item,
        type: 'tag',
        get: 'tagged',
      },
      {
        heading: '#' + item.title,
        id: item.id,
        type: item.type,
      },
    );
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
        justifyContent: 'space-between',
      }}>
      <View
        style={{
          maxWidth: '92%',
        }}>
        <Heading size={SIZE.md}>
          <Heading
            size={SIZE.md}
            style={{
              color: colors.accent,
            }}>
            #
          </Heading>
          {item.title}
        </Heading>
        <Paragraph
          color={colors.icon}
          size={SIZE.xs}
          style={{
            marginTop: 5,
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
          let rowItems = ['Add Shortcut', 'Delete', 'Edit Tag'];
          ActionSheetEvent(item, false, false, rowItems);
        }}
        testID={notesnook.ids.tag.menu}
        customStyle={{
          justifyContent: 'center',
          height: 35,
          width: 35,
          borderRadius: 100,
          alignItems: 'center',
        }}
      />
    </PressableButton>
  );
};

export default TagItem;
