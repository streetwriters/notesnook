import React from 'react';
import {Text} from 'react-native';
import {PressableButton} from '../../components/PressableButton';
import {useTracked} from '../../provider';
import NavigationService from '../../services/Navigation';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const TagItem = ({item, index}) => {
  const [state] = useTracked();
  const {colors} = state;
  return (
    <PressableButton
      onPress={() => {
        NavigationService.navigate('NotesPage', {
          type: 'tag',
          title: item.title,
          tag: item,
        });
      }}
      selectedColor={colors.nav}
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={1}
      customStyle={{
        paddingHorizontal: 12,
        height: 80,
        justifyContent: 'center',
        alignItems: 'flex-start',
        borderBottomWidth: 1.5,
        borderBottomColor: colors.nav,
      }}>
      <Heading size={SIZE.md}>
        <Heading
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
    </PressableButton>
  );
};

export default TagItem;
