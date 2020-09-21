import React from 'react';
import {Dimensions, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ph, SIZE, WEIGHT} from '../../common/common';
import {timeSince} from '../../utils/utils';
import {ActionIcon} from '../ActionIcon';
import {ActionSheetEvent} from '../DialogManager/recievers';
import {PressableButton} from '../PressableButton';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

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
            borderBottomColor: item.pinned ? 'transparent' : colors.nav,
          },
          customStyle ? customStyle : {},
        ]}>
        <View
          style={{
            paddingLeft: 0,
            width: '92%',
          }}>
          <Text
            numberOfLines={1}
            style={{
              color: colors.heading,
              fontSize: SIZE.md,
              fontFamily: WEIGHT.bold,
              maxWidth: '100%',
            }}>
            {item.title.replace('\n', '')}
          </Text>
          <View
            style={{
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              width: '100%',
            }}>
            <Text
              numberOfLines={2}
              style={{
                fontSize: SIZE.xs + 1,
                color: colors.pri + 'B3',
                fontFamily: WEIGHT.regular,
                width: '100%',
                maxWidth: '100%',
                paddingRight: ph,
              }}>
              {item.headline[item.headline.length - 1] === '\n'
                ? item.headline.slice(0, item.headline.length - 1)
                : item.headline}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                marginTop: 5,
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
                            backgroundColor: item,
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
                      size={SIZE.xs + 1}
                      color="orange"
                    />
                  ) : null}
                  <Text
                    style={{
                      color: colors.icon,
                      fontSize: SIZE.xs - 1,
                      textAlignVertical: 'center',
                      fontFamily: WEIGHT.regular,
                      marginRight: 10,
                    }}>
                    {timeSince(item.dateCreated)}
                  </Text>
                </>
              ) : null}

              {isTrash ? (
                <>
                  <Text
                    style={{
                      color: colors.icon,
                      fontSize: SIZE.xs - 1,
                      textAlignVertical: 'center',
                      fontFamily: WEIGHT.regular,
                    }}>
                    {'Deleted on: ' + item && item.dateDeleted
                      ? new Date(item.dateDeleted).toISOString().slice(0, 10)
                      : null + '   '}
                  </Text>
                  <Text
                    style={{
                      color: colors.accent,
                      fontSize: SIZE.xs - 1,
                      textAlignVertical: 'center',
                      fontFamily: WEIGHT.regular,
                    }}>
                    {item.type[0].toUpperCase() + item.type.slice(1) + '  '}
                  </Text>
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
                  <Text
                    style={{
                      fontSize: SIZE.xs - 1,
                      color: 'white',
                    }}>
                    CONFLICTS
                  </Text>
                </View>
              ) : null}
            </View>
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
