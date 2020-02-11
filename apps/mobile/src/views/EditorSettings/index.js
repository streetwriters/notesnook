import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {useTracked} from '../../provider';
const EditorSettings = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return (
    <Container
      menu={true}
      heading="Editor"
      canGoBack={false}
      noSearch={true}
      noSelectionHeader={true}
      noBottomButton={true}>
      <View
        style={{
          marginTop: Platform.OS == 'ios' ? 135 - 60 : 155 - 60,
        }}
      />

      <View
        style={{
          paddingHorizontal: 12,
        }}>
        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: '100%',
            marginHorizontal: 0,
            paddingVertical: pv,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            paddingBottom: pv + 5,
            borderBottomColor: colors.nav,
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
              color: colors.pri,
            }}>
            Show toolbar on top
          </Text>
          <Icon
            size={SIZE.xl}
            color={colors.night ? colors.accent : colors.icon}
            name={colors.night ? 'toggle-switch' : 'toggle-switch-off'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: '100%',
            marginHorizontal: 0,
            paddingVertical: pv,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            paddingBottom: pv + 5,
            borderBottomColor: colors.nav,
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              textAlignVertical: 'center',
              color: colors.pri,
            }}>
            Show keyboard on open
          </Text>
          <Icon
            size={SIZE.xl}
            color={colors.night ? colors.accent : colors.icon}
            name={colors.night ? 'toggle-right' : 'toggle-left'}
          />
        </TouchableOpacity>
      </View>
    </Container>
  );
};

EditorSettings.navigationOptions = {
  header: null,
};

export default EditorSettings;
