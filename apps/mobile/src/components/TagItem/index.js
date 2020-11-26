import React from 'react';
import {View} from 'react-native';
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

  const onPress = () => {
    Navigation.navigate(
      'NotesPage',
      {
        type: 'tag',
        title: item.title,
        tag: item,
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
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={1}
      customStyle={{
        paddingHorizontal: 12,
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1.5,
        borderBottomColor: colors.nav,
        width: '100%',
        justifyContent: 'space-between',
      }}>
      <View>
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
          let rowItems = [];
          let columnItems = ['Pin to Menu', 'Unpin from Menu'];
          ActionSheetEvent(item, false, false, rowItems, columnItems);
        }}
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
