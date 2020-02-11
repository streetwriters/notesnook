import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {useTracked} from '../../provider';
import NavigationService from '../../services/NavigationService';
import {w} from '../../utils/utils';
export const Settings = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  return (
    <Container
      menu={true}
      heading="Settings"
      canGoBack={false}
      noSearch={true}
      noSelectionHeader={true}
      noBottomButton={true}>
      <FlatList
        ListHeaderComponent={
          <View
            style={{
              marginTop: Platform.OS == 'ios' ? 135 - 60 : 155 - 60,
            }}
          />
        }
        data={[
          {
            name: 'Account',
            func: () => {
              NavigationService.navigate('AccountSettings');
            },
          },
          {
            name: 'Appearance',
            func: () => {
              NavigationService.navigate('AppearanceSettings');
            },
          },
          {
            name: 'Editor',
            func: () => {
              NavigationService.navigate('EditorSettings');
            },
          },
          {
            name: 'Terms of Service',
            func: () => {},
          },
          {
            name: 'Privacy Policy',
            func: () => {},
          },
          {
            name: 'About',
            func: () => {},
          },
        ]}
        keyExtractor={item => item.name}
        renderItem={({item, index}) => (
          <TouchableOpacity
            key={item.name}
            activeOpacity={opacity}
            onPress={item.func}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.nav,
              width: item.step ? '85%' : w - 24,
              marginHorizontal: 12,
              paddingVertical: pv + 5,
              marginLeft: item.step ? '10%' : 12,
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
            {item.customComponent ? item.customComponent : null}
          </TouchableOpacity>
        )}
      />
    </Container>
  );
};

Settings.navigationOptions = {
  header: null,
};

export default Settings;
