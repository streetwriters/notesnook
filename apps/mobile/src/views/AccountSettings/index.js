import React from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {useTracked} from '../../provider';
import {AnimatedSafeAreaView} from '../../utils/refs';

export const AccountSettings = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <Header colors={colors} heading="" canGoBack={true} />

      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',

          alignSelf: 'center',
        }}>
        <Text
          style={{
            color: colors.pri,
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.lg,
            marginTop: 10,
          }}>
          Alex's Account
        </Text>

        <View
          style={{
            borderRadius: 5,
            padding: 5,
            paddingVertical: 2.5,
            marginBottom: 20,
            marginTop: 10,
            backgroundColor: colors.accent,
          }}>
          <Text
            style={{
              color: 'white',
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            Pro
          </Text>
        </View>
      </View>
      <FlatList
        data={[
          {
            name: 'Backup',
          },
          {
            name: 'My Devices',
          },
          {
            name: 'Vault',
          },
          {
            name: 'My Subscription',
          },
          {
            name: 'Change Password',
          },
          {
            name: 'Logout',
          },
        ]}
        keyExtractor={item => item.name}
        renderItem={({item, index}) => (
          <TouchableOpacity
            activeOpacity={opacity}
            style={{
              borderBottomWidth: 1,
              width: '90%',
              marginHorizontal: '5%',
              borderBottomColor: colors.nav,
              paddingVertical: pv + 5,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                textAlignVertical: 'center',
                color: colors.pri,
              }}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </AnimatedSafeAreaView>
  );
};

AccountSettings.navigationOptions = {
  header: null,
};

export default AccountSettings;
