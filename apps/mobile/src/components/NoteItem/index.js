import React from 'react';
import {Dimensions, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ph, pv, SIZE, WEIGHT} from '../../common/common';
import {eSendEvent, openVault} from '../../services/eventManager';
import {eOnLoadNote} from '../../services/events';
import {openEditorAnimation} from '../../utils/animations';
import {getElevation, timeSince, DDS} from '../../utils/utils';
import {ActionSheetEvent, simpleDialogEvent} from '../DialogManager/recievers';
import {TEMPLATE_TRASH} from '../DialogManager/templates';

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
    let {
      colors,
      item,
      customStyle,
      onLongPress,
      isTrash,
      pinned,
      index,
    } = this.props;

    console.log('rerendering again', index);
    return (
      <View
        style={[
          {
            paddingVertical: pv,
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            maxWidth: '100%',
            paddingRight: 6,
            alignSelf: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.nav,
          },
          customStyle ? customStyle : {},
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => onLongPress()}
          onPress={() => {
            if (this.props.selectionMode) {
              this.props.onLongPress();
              return;
            } else if (item.locked) {
              openVault(item, true, true, false, true, false);

              return;
            }
            if (DDS.isTab) {
              eSendEvent(eOnLoadNote, item);
            } else if (isTrash) {
              simpleDialogEvent(TEMPLATE_TRASH(item.type));
            } else {
              eSendEvent(eOnLoadNote, item);
              openEditorAnimation();
            }
          }}
          style={{
            paddingLeft: 0,
            width: '95%',
          }}>
          <>
            <Text
              numberOfLines={1}
              style={{
                color: colors.pri,
                fontSize: SIZE.sm + 1,
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
                  fontSize: SIZE.sm - 1,
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
                        {item.colors.map(item => (
                          <View
                            key={item}
                            style={{
                              width: SIZE.xs,
                              height: SIZE.xs,
                              borderRadius: 100,
                              backgroundColor: item,
                              marginRight: -4.5,
                            }}></View>
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
                      {'Deleted on: ' +
                        new Date(item.dateDeleted).toISOString().slice(0, 10) +
                        '   '}
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
              </View>
            </View>
          </>
        </TouchableOpacity>

        <View
          style={{
            justifyContent: 'center',
            minHeight: 70,
            alignItems: 'center',
          }}>
          <TouchableOpacity
            style={{
              justifyContent: 'center',
              minHeight: 70,
              alignItems: 'center',
            }}
            onPress={() => {
              ActionSheetEvent(
                item,
                isTrash ? false : true,
                isTrash ? false : true,
                isTrash
                  ? ['Remove', 'Restore']
                  : ['Add to', 'Share', 'Export', 'Delete', 'Open'],
                isTrash ? [] : ['Pin', 'Favorite', 'Add to Vault'],
              );
            }}>
            <Icon name="dots-horizontal" size={SIZE.lg} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
