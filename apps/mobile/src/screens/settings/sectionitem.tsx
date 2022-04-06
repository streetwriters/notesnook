import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { ReactElement } from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ToggleSwitch from 'toggle-switch-react-native';
import { PressableButton } from '../../components/ui/pressable';
import Paragraph from '../../components/ui/typography/paragraph';
import SettingsService from '../../services/settings';
import { useSettingStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { SIZE } from '../../utils/size';
import { AccentColorPicker } from './appearance';
import { RouteParams, SettingSection } from './types';

const components: { [name: string]: ReactElement } = {
  colorpicker: <AccentColorPicker wrap={true} />
};

export const SectionItem = ({ item }: { item: SettingSection }) => {
  const colors = useThemeStore(state => state.colors);
  const settings = useSettingStore(state => state.settings);
  const navigation = useNavigation<NavigationProp<RouteParams>>();

  const onChangeSettings = () => {
    if (!item.property) return;
    SettingsService.set(
      item.modifer
        ? item.modifer(item.property)
        : {
            [item.property]: !settings[item.property]
          }
    );
  };
  return (
    <PressableButton
      key={item.name}
      disabled={item.type === 'component'}
      customStyle={{
        width: '100%',
        alignItems: 'center',
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 20
      }}
      onPress={() => {
        switch (item.type) {
          case 'screen':
            navigation.navigate('SettingsGroup', item);
            break;
          case 'switch':
            onChangeSettings();
            break;
        }
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flexShrink: 1
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            backgroundColor: item.component === 'colorpicker' ? colors.accent : undefined,
            borderRadius: 100
          }}
        >
          {!!item.icon && <Icon name={item.icon} size={30} />}
        </View>

        <View
          style={{
            flexShrink: 1,
            paddingRight: item.type === 'switch' ? 10 : 0
          }}
        >
          <Paragraph color={colors.heading} size={SIZE.md + 1}>
            {item.name}
          </Paragraph>
          <Paragraph size={SIZE.sm}>{item.description}</Paragraph>

          {!!item.component && components[item.component]}
        </View>
      </View>

      {item.type === 'switch' && item.property && (
        <ToggleSwitch
          isOn={item.getter ? item.getter(item.property) : settings[item.property]}
          onColor={colors.accent}
          offColor={colors.icon}
          size="small"
          animationSpeed={150}
          onToggle={onChangeSettings}
        />
      )}
    </PressableButton>
  );
};
