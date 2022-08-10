import React from 'react';
import { View } from 'react-native';
import { notesnook } from '../../../../e2e/test.ids';
import { TaggedNotes } from '../../../screens/notes/tagged';
import { useThemeStore } from '../../../stores/use-theme-store';
import { db } from '../../../utils/database';
import { SIZE } from '../../../utils/size';
import { Properties } from '../../properties';
import { IconButton } from '../../ui/icon-button';
import { PressableButton } from '../../ui/pressable';
import Heading from '../../ui/typography/heading';
import Paragraph from '../../ui/typography/paragraph';

const TagItem = React.memo(
  ({ item, index }) => {
    const colors = useThemeStore(state => state.colors);
    const onPress = () => {
      TaggedNotes.navigate(item, true);
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
          flexDirection: 'row',
          paddingVertical: 12,
          alignItems: 'center',
          width: '100%',
          justifyContent: 'space-between'
        }}
      >
        <View
          style={{
            maxWidth: '92%'
          }}
        >
          <Heading size={SIZE.md}>
            <Heading
              size={SIZE.md}
              style={{
                color: colors.accent
              }}
            >
              #
            </Heading>
            {item.alias}
          </Heading>
          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={{
              marginTop: 5
            }}
          >
            {item && item.noteIds.length && item.noteIds.length > 1
              ? item.noteIds.length + ' notes'
              : item.noteIds.length === 1
              ? item.noteIds.length + ' note'
              : null}
          </Paragraph>
        </View>

        <IconButton
          color={colors.heading}
          name="dots-horizontal"
          size={SIZE.xl}
          onPress={() => {
            Properties.present(item);
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

TagItem.displayName = 'TagItem';

export default TagItem;
