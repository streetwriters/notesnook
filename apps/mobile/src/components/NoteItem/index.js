import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {Actions} from '../../provider/Actions';
import Navigation from '../../services/Navigation';
import {COLORS_NOTE} from '../../utils/Colors';
import {db} from '../../utils/DB';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {ActionSheetEvent, updateEvent} from '../DialogManager/recievers';
import {TimeSince} from '../Menu/TimeSince';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export default class NoteItem extends React.Component {
  constructor(props) {
    super(props);
    this.cipher = {
      value: false,
    };
    this.color;
    this.actionSheet;
    this.show = null;
    this.setMenuRef = {};
    this.willRefresh = false;
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      nextProps.item.locked !== this.cipher.value ||
      nextProps.item.color !== this.color ||
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
    this.color = this.props.item.color;
    this.cipher.value = this.props.item.locked ? true : false;
  }
  componentWillUnmount() {
    this.color = null;
    this.cipher.value = false;
  }
  componentDidMount() {
    this.color = null;
    if (this.props.item.locked) {
      this.cipher.value = true;
    }
  }

  showActionSheet = () => {
    ActionSheetEvent(
      this.props.item,
      this.props.isTrash ? false : true,
      this.props.isTrash ? false : true,
      this.props.isTrash
        ? ['Remove', 'Restore']
        : ['Add to', 'Share', 'Export', 'Delete', 'Copy'],
      this.props.isTrash ? [] : ['Pin', 'Favorite', 'Add to Vault'],
    );
  };

  render() {
    let {colors, item, customStyle, isTrash} = this.props;
    console.log(item, 'ITE<');
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
          {item.notebooks && item.notebooks.length > 0 && (
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
                  Navigation.navigate('Notebook', {
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
                  color={item.color ? COLORS_NOTE[item.color] : colors.accent}>
                  {db.notebooks.notebook(item.notebooks[0].id).title}
                </Heading>
              </TouchableOpacity>
            </View>
          )}

          <Heading
            color={COLORS_NOTE[item.color]}
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
                {item.color && (
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
                )}

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

                <TimeSince
                  style={{fontSize: SIZE.xs, color: colors.icon}}
                  time={item.dateCreated}
                  updateFrequency={
                    Date.now() - item.dateCreated < 60000 ? 2000 : 60000
                  }
                />
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
          testID={notesnook.ids.note.menu}
          size={SIZE.xl}
          onPress={this.showActionSheet}
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
