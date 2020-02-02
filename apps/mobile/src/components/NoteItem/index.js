import React from 'react';
import {
  Dimensions,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {DDS} from '../../../App';
import {ph, pv, SIZE, WEIGHT} from '../../common/common';
import NavigationService from '../../services/NavigationService';
import {getElevation, timeSince} from '../../utils/utils';
import {
  ActionSheetEvent,
  TEMPLATE_TRASH,
  simpleDialogEvent,
} from '../DialogManager';
import {eSendEvent} from '../../services/eventManager';
import {eOnLoadNote, eOpenSimpleDialog} from '../../services/events';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export default class NoteItem extends React.Component {
  constructor(props) {
    super(props);
    this.cipher = {
      value: false,
    };
    this.actionSheet;
    this.show = null;
    this.setMenuRef = {};
    this.willRefresh = false;
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.item.locked !== this.cipher.value) {
      return true;
    } else {
      return (
        JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
        nextState !== this.state
      );
    }
  }
  componentDidUpdate() {
    this.cipher.value = this.props.item.locked ? true : false;
  }
  componentWillUnmount() {
    this.cipher.value = false;
  }
  componentDidMount() {
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
    console.log('rendering', index);
    return (
      <View
        style={[
          {
            paddingVertical: pv,
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            maxWidth: '100%',
            paddingRight: 12,

            alignSelf: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.nav,
          },
          customStyle ? customStyle : {},
        ]}>
        {pinned ? (
          <View
            style={{
              ...getElevation(3),
              width: 30,
              height: 30,
              backgroundColor: colors.accent,
              borderRadius: 100,
              position: 'absolute',
              left: 20,
              top: -15,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                width: 5,
                height: 5,
                backgroundColor: 'white',
                borderRadius: 100,
              }}
            />
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={1}
          onLongPress={() => onLongPress()}
          onPress={() => {
            if (item.locked) {
              this.setState({
                unlock: true,
                vaultDialog: true,
              });
            } else {
              DDS.isTab
                ? eSendEvent(eOnLoadNote, item)
                : isTrash
                ? simpleDialogEvent(TEMPLATE_TRASH(item.type))
                : NavigationService.navigate('Editor', {
                    note: item,
                  });
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
                fontSize: SIZE.md,
                fontFamily: WEIGHT.bold,
                maxWidth: '95%',
                marginBottom: 5,
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
                  fontSize: SIZE.sm,
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
                  marginTop: 10,
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
            width: DDS.isTab ? w * 0.7 * 0.05 : w * 0.05,
            justifyContent: 'center',
            minHeight: 70,
            alignItems: 'center',
          }}>
          <TouchableOpacity
            style={{
              width: w * 0.05,
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
                  : ['Add to', 'Share', 'Export', 'Delete'],
                [],
              );
            }}>
            <Icon name="more-horizontal" size={SIZE.lg} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
