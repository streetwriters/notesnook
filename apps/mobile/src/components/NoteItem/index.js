import React from 'react';
import {Dimensions, Text, View, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ActionIcon} from '../ActionIcon';
import {ActionSheetEvent, updateEvent} from '../DialogManager/recievers';
import {timeSince} from '../../utils/TimeUtils';
import {ph, SIZE, WEIGHT} from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';
import Heading from '../Typography/Heading';
import {db} from '../../utils/DB';
import {Actions} from '../../provider/Actions';
import NavigationService from '../../services/Navigation';
import {COLORS_NOTE} from '../../utils/Colors';

export default class NoteItem extends React.Component {
  constructor(props) {
    super(props);
    this.cipher = {
      value: false,
    };
    this.colors = [];
    this.actionSheet;
    this.show = null;
    this.setMenuRef = {};
    this.willRefresh = false;
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextProps.item.locked !== this.cipher.value ||
      nextProps.item.colors.length !== this.colors.length ||
      nextProps.selectionMode !== this.props.selectionMode
    ) {
      return true;
    } else {
      return (
        JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
        nextState !== this.state
      );
    }
  }
  componentDidUpdate() {
    this.colors = [...this.props.item.colors];
    this.cipher.value = this.props.item.locked ? true : false;
  }
  componentWillUnmount() {
    this.colors = [];
    this.cipher.value = false;
  }
  componentDidMount() {
    this.colors = [];
    if (this.props.item.locked) {
      this.cipher.value = true;
    }
  }

  render() {
    let {colors, item, customStyle, isTrash} = this.props;

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
            height: 100,
            borderBottomColor: colors.nav,
          },
          customStyle ? customStyle : {},
        ]}>
        <View
          style={{
            width: '92%',
            paddingRight: 5,
          }}>
          {item.notebook && item.notebook.id && (
            <View
              style={{
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  let notebook = db.notebooks.notebook(item.notebook.id).data;
                  updateEvent({
                    type: Actions.HEADER_TEXT_STATE,
                    state: {
                      heading: notebook.title,
                    },
                  });
                  updateEvent({
                    type: Actions.HEADER_STATE,
                    state: false,
                  });
                  NavigationService.navigate('Notebook', {
                    notebook: db.notebooks.notebook(item.notebook.id).data,
                    title: notebook.title,
                    root: true,
                  });
                }}
                style={{
                  paddingVertical: 1.5,
                  marginBottom: 2.5,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon
                  name="book-outline"
                  color={colors.accent}
                  size={SIZE.xs}
                  style={{
                    marginRight: 2.5,
                  }}
                />
                <Heading
                  size={SIZE.xs}
                  color={
                    item.colors[0] ? COLORS_NOTE[item.colors[0]] : colors.accent
                  }>
                  {db.notebooks.notebook(item.notebook.id).title}
                </Heading>
              </TouchableOpacity>
            </View>
          )}

          <Heading
            color={COLORS_NOTE[item.colors[0]]}
            numberOfLines={1}
            size={SIZE.md}>
            {item.title.replace('\n', '')}
          </Heading>

          <Paragraph numberOfLines={2}>
            {item.headline[item.headline.length - 1] === '\n'
              ? item.headline.slice(0, item.headline.length - 1)
              : item.headline}
          </Paragraph>

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
                {item.colors.length > 0 ? (
                  <View
                    style={{
                      marginRight: 10,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {item.colors.map((item) => (
                      <View
                        key={item}
                        style={{
                          width: SIZE.xs,
                          height: SIZE.xs,
                          borderRadius: 100,
                          backgroundColor: COLORS_NOTE[item],
                          marginRight: -4.5,
                        }}
                      />
                    ))}
                  </View>
                ) : null}

                {item.locked ? (
                  <Icon
                    style={{marginRight: 10}}
                    name="lock"
                    size={SIZE.xs}
                    color={colors.icon}
                  />
                ) : null}

                {item.favorite ? (
                  <Icon
                    style={{marginRight: 10}}
                    name="star"
                    size={SIZE.md}
                    color="orange"
                  />
                ) : null}
                <Paragraph
                  color={colors.icon}
                  size={SIZE.xs}
                  style={{
                    textAlignVertical: 'center',
                    marginRight: 10,
                  }}>
                  {timeSince(item.dateCreated)}
                </Paragraph>
              </>
            ) : null}

            {isTrash ? (
              <>
                <Paragraph
                  color={colors.icon}
                  size={SIZE.xs}
                  style={{
                    textAlignVertical: 'center',
                  }}>
                  {item.itemType[0].toUpperCase() +
                    item.itemType.slice(1) +
                    '  '}
                </Paragraph>
                <Paragraph
                  color={colors.icon}
                  size={SIZE.xs}
                  style={{
                    textAlignVertical: 'center',
                  }}>
                  Deleted on{' '}
                  {item && item.dateDeleted
                    ? new Date(item.dateDeleted).toISOString().slice(0, 10)
                    : null + '   '}
                </Paragraph>
              </>
            ) : null}

            {item.conflicted ? (
              <View
                style={{
                  backgroundColor: colors.errorText,
                  borderRadius: 2.5,
                  paddingHorizontal: 4,
                  position: 'absolute',
                  right: 20,
                }}>
                <Paragraph
                  size={SIZE.xs}
                  style={{
                    color: 'white',
                  }}>
                  CONFLICTS
                </Paragraph>
              </View>
            ) : null}
          </View>
        </View>

        <ActionIcon
          color={colors.heading}
          name="dots-horizontal"
          size={SIZE.xl}
          onPress={() => {
            ActionSheetEvent(
              item,
              isTrash ? false : true,
              isTrash ? false : true,
              isTrash
                ? ['Remove', 'Restore']
                : ['Add to', 'Share', 'Export', 'Delete', 'Copy'],
              isTrash ? [] : ['Pin', 'Favorite', 'Add to Vault'],
            );
          }}
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
}
