import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { notesnook } from '../../../e2e/test.ids';
import { useTracked } from '../../provider';
import { COLORS_NOTE } from '../../utils/Colors';
import { db } from '../../utils/DB';
import { SIZE } from '../../utils/SizeUtils';
import { ActionIcon } from '../ActionIcon';
import { ActionSheetEvent } from '../DialogManager/recievers';
import { TimeSince } from '../Menu/TimeSince';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const NoteItem = ({item, customStyle, isTrash, fontScale}) => {
  const [state] = useTracked();
  const {colors} = state;

  const showActionSheet = () => {
    let note = isTrash? item : db.notes.note(item?.id)?.data;
    ActionSheetEvent( 
      note ? note : item,
      isTrash ? false : true,
      isTrash ? false : true,
      isTrash
        ? ['Remove', 'Restore']
        : ['Add to', 'Share', 'Export', 'Delete', 'Copy'],
      isTrash ? [] : ['Pin', 'Favorite', 'Add to Vault'],
    );
  };
  return (
    <View
      style={[
        {
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
          paddingRight: 6,
          alignSelf: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
          height: 100 * fontScale,
        },
        customStyle ? customStyle : {},
      ]}>
      <View
        style={{
          width: '92%',
          paddingRight: 5,
        }}>
        {!isTrash && item.notebooks && item.notebooks.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
            }}>
            <TouchableOpacity
              activeOpacity={1}
              style={{
                paddingVertical: 1.5,
                marginBottom: 2.5,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Icon
                name="book-outline"
                color={item.color ? COLORS_NOTE[item.color] : colors.accent}
                size={SIZE.xs}
                style={{
                  marginRight: 2.5,
                }}
              />
              <Heading
                size={SIZE.xs}
                color={item.color ? COLORS_NOTE[item.color] : colors.accent}>
                {db.notebooks.notebook(item.notebooks[0]?.id)?.title + ' '}{' '}
                {item.notebooks.length > 1
                  ? '& ' + (item.notebooks.length - 1) + ' others'
                  : ''}
              </Heading>
            </TouchableOpacity>
          </View>
        ) : null}

        <Heading
          color={COLORS_NOTE[item.color]}
          numberOfLines={1}
          size={SIZE.md}>
          {item.title}
        </Heading>

        {item.headline ? (
          <Paragraph numberOfLines={2}>{item.headline}</Paragraph>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: 2.5,
          }}>
          {!isTrash ? (
            <>
              <TimeSince
                style={{
                  fontSize: SIZE.xs,
                  color: colors.icon,
                  marginRight: 10,
                }}
                time={item.dateCreated}
                updateFrequency={
                  Date.now() - item.dateCreated < 60000 ? 2000 : 60000
                }
              />

              {item.color ? (
                <View
                  key={item}
                  style={{
                    width: SIZE.xs,
                    height: SIZE.xs,
                    borderRadius: 100,
                    backgroundColor: COLORS_NOTE[item.color],
                    marginRight: -4.5,
                    marginRight: 10,
                  }}
                />
              ) : null}

              {item.locked ? (
                <Icon
                  style={{marginRight: 10}}
                  name="lock"
                  size={SIZE.sm}
                  style={{
                    marginRight: 10,
                  }}
                  color={colors.icon}
                />
              ) : null}

              {item.pinned ? (
                <Icon
                  style={{marginRight: 10}}
                  name="pin"
                  size={SIZE.sm}
                  style={{
                    marginRight: 10,
                    marginTop: 2,
                  }}
                  color={colors.accent}
                />
              ) : null}

              {item.favorite ? (
                <Icon
                  style={{marginRight: 10}}
                  name="star"
                  size={SIZE.md}
                  style={{
                    marginRight: 10,
                  }}
                  color="orange"
                />
              ) : null}
            </>
          ) : null}

          {isTrash ? (
            <>
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  marginRight: 10,
                }}>
                {item.itemType[0].toUpperCase() + item.itemType.slice(1)}
              </Paragraph>
              <Paragraph
                color={colors.icon}
                size={SIZE.xs}
                style={{
                  marginRight: 10,
                }}>
                Deleted on{' '}
                {item && item.dateDeleted
                  ? new Date(item.dateDeleted).toISOString().slice(0, 10)
                  : null}
              </Paragraph>
            </>
          ) : null}
        </View>
      </View>

      <ActionIcon
        color={colors.heading}
        name="dots-horizontal"
        testID={notesnook.ids.note.menu}
        size={SIZE.xl}
        onPress={showActionSheet}
        customStyle={{
          justifyContent: 'center',
          height: 35,
          width: 35,
          borderRadius: 100,
          alignItems: 'center',
        }}
      />
    </View>
  );
}

export default NoteItem;
