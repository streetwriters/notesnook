import React from 'react';
import {Modal, TouchableOpacity, View, Text, FlatList} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {DDS, getElevation} from '../../utils/utils';
import {SIZE, WEIGHT, opacity, pv} from '../../common/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NavigationService from '../../services/NavigationService';
import {eSendEvent} from '../../services/eventManager';
import {eCloseSideMenu} from '../../services/events';

class PremiumDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      animated: false,
    };
    this.routeIndex = 0;
    this.count = 0;
  }

  open() {
    this.setState({
      visible: true,
    });
  }

  close() {
    this.setState({
      visible: false,
    });
  }

  render() {
    const {visible, animated} = this.state;
    const {colors} = this.props;
    return (
      <Modal
        animated={true}
        animationType="fade"
        visible={visible}
        transparent={true}>
        <Animatable.View
          transition={['opacity', 'scaleX', 'scaleY']}
          useNativeDriver={true}
          duration={300}
          iterationCount={1}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            width: '100%',
            height: '100%',
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() => this.close()}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              zIndex: 1,
            }}
          />

          <View
            style={{
              width: '90%',
              backgroundColor: colors.bg,
              elevation: 5,
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              borderRadius: 5,
              zIndex: 2,
            }}>
            <Text
              style={{
                fontSize: SIZE.lg,
                fontFamily: WEIGHT.bold,
                color: colors.heading,
                paddingVertical: 20,
              }}>
              Unlock Premium Features
            </Text>

            <Text
              style={{
                fontSize: SIZE.xxxl + 10,
                fontFamily: WEIGHT.medium,
                color: colors.pri,
                paddingVertical: 15,
              }}>
              6.99
              <Text
                style={{
                  color: colors.accent,
                  fontSize: 12,
                }}>
                /month
              </Text>
            </Text>
            <FlatList
              data={[
                'Sync across unlimted devices on any platform',
                'Zero-knowledge encryption',
                'Organize your notes using notebooks, tags and colors',
                'Rich-text editor for all your note taking needs',
                'Secure local vault',
              ]}
              keyExtractor={(item,index) => item}
              renderItem={({item, index}) => (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    paddingVertical: 5,
                  }}>
                  <Icon name="check" size={SIZE.lg} color={colors.accent} />

                  <Text
                    style={{
                      marginLeft: 10,
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.sm,
                      maxWidth: '80%',
                    }}>
                    {item}
                  </Text>
                </View>
              )}
            />

            <TouchableOpacity
              activeOpacity={opacity}
              style={{
                padding: pv + 2,
                borderRadius: 5,
                marginTop: 10,
                marginHorizontal: 12,
                marginBottom: 10,
                alignItems: 'center',
                width: '100%',
              }}>
              <Text
                style={{
                  fontSize: SIZE.lg,
                  fontFamily: WEIGHT.medium,
                  color: colors.accent,
                  textAlign: 'center',
                }}>
                BUY NOW
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={opacity}
              onPress={() => {
                this.close();
                eSendEvent(eCloseSideMenu);
                NavigationService.navigate('Signup', {
                  root: true,
                  fromHome: true,
                });
              }}
              style={{
                ...getElevation(3),
                padding: pv + 2,
                backgroundColor: colors.accent,
                borderRadius: 5,
                marginTop: 10,
                marginHorizontal: 12,
                marginBottom: 10,
                alignItems: 'center',
                width: '100%',
              }}>
              <Text
                style={{
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.medium,
                  color: 'white',
                  textAlign: 'center',
                }}>
                Start your 14 day trial
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: SIZE.xxs,
                fontFamily: WEIGHT.medium,
                color: colors.pri,
                paddingBottom: 10,
                textAlign: 'center',
              }}>
              No credit card required
            </Text>
          </View>
        </Animatable.View>
      </Modal>
    );
  }
}

export default PremiumDialog;