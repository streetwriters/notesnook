import React from 'react';
import {Text} from 'react-native';
import {PressableButton} from '../../components/PressableButton';
import {useTracked} from '../../provider';
import NavigationService from '../../services/Navigation';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';

const TagItem = ({item, index}) => {
  const [state, ] = useTracked();
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
      <Text
        style={{
          fontFamily: WEIGHT.bold,
          fontSize: SIZE.md,
          color: colors.heading,
        }}>
        <Text
          style={{
            color: colors.accent,
          }}>
          #
        </Text>

        {item.title}
      </Text>
      <Text
        style={{
          fontSize: SIZE.xs,
          color: colors.icon,
          fontFamily: WEIGHT.regular,
          marginTop: 5,
        }}>
        {item && item.noteIds.length && item.noteIds.length > 1
          ? item.noteIds.length + ' notes'
          : item.noteIds.length === 1
          ? item.noteIds.length + ' note'
          : null}
      </Text>
    </PressableButton>
  );
};

export default TagItem;
