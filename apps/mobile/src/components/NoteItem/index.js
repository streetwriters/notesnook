import React from 'react';
import {View, Text, TouchableOpacity, Dimensions} from 'react-native';
import {SIZE, ph, pv, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {timeSince, ToastEvent, getElevation} from '../../utils/utils';
import NavigationService from '../../services/NavigationService';
import {Dialog} from '../Dialog';
import {VaultDialog} from '../VaultDialog';
import {db} from '../../../App';
import {DDS} from '../../../App';
import _ from 'lodash';

import {ActionSheetEvent} from '../DialogManager';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export default class NoteItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      unlockNote: false,
      vaultDialog: false,
      isPerm: false,
    };
    this.actionSheet;
    this.show = null;
    this.setMenuRef = {};
    this.willRefresh = false;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
      nextState !== this.state
    );
  }

  render() {
    let {unlock, vaultDialog, isPerm, visible} = this.state;
    let {
      colors,
      item,
      width,
      customStyle,
      onLongPress,
      isTrash,
      pinned,
      update,
      index,
    } = this.props;

    console.log('rerendering' + index);
    return (
      <View
        style={[
          {
            paddingVertical: pv,
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            marginHorizontal: 12,
            width: width,

            paddingRight: 6,
            alignSelf: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.nav,
          },
          customStyle ? customStyle : {},
        ]}>
        <VaultDialog
          close={() => {
            this.setState({
              vaultDialog: false,
              unlock: false,
              isPerm: false,
            });
          }}
          note={item}
          perm={isPerm}
          openedToUnlock={unlock}
          visible={vaultDialog}
        />

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
              NavigationService.navigate('Editor', {
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
                style={{
                  fontSize: SIZE.xs + 1,
                  color: colors.pri,
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
            paddingRight: ph,
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
                true,
                true,
                ['Add to', 'Share', 'Export', 'Delete'],
                ['Add to Vault', 'Pin', 'Favorite'],
              );
            }}>
            <Icon name="more-horizontal" size={SIZE.lg} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
