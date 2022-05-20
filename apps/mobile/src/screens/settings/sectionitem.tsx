import { NavigationProp, StackActions, useNavigation } from '@react-navigation/native';
import React, { ReactElement } from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ToggleSwitch from 'toggle-switch-react-native';
import { PressableButton } from '../../components/ui/pressable';
import Seperator from '../../components/ui/seperator';
import Paragraph from '../../components/ui/typography/paragraph';
import SettingsService from '../../services/settings';
import useNavigationStore from '../../stores/use-navigation-store';
import { useSettingStore } from '../../stores/use-setting-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { SIZE } from '../../utils/size';
import { AccentColorPicker, HomagePageSelector } from './appearance';
import { AutomaticBackupsSelector } from './backup-restore';
import { Subscription } from './subscription';
import { RouteParams, SettingSection } from './types';

const components: { [name: string]: ReactElement } = {
  colorpicker: <AccentColorPicker wrap={true} />,
  homeselector: <HomagePageSelector />,
  autobackups: <AutomaticBackupsSelector />,
  subscription: <Subscription />
};

export const SectionItem = React.memo(
  ({ item }: { item: SettingSection }) => {
    const colors = useThemeStore(state => state.colors);
    const settings = useSettingStore(state => state.settings);
    const navigation = useNavigation<NavigationProp<RouteParams>>();
    const current = item.useHook && item.useHook(item);
    const isHidden = item.hidden && item.hidden(item.property || current);
    const onChangeSettings = () => {
      if (item.modifer) {
        item.modifer(item.property || current);
        return;
      }
      if (!item.property) return;
      SettingsService.set({
        [item.property]: !settings[item.property]
      });
    };

    const styles =
      item.type === 'danger'
        ? {
            backgroundColor: colors.errorBg
          }
        : {};

    return isHidden ? null : (
      <PressableButton
        disabled={item.type === 'component'}
        customStyle={{
          width: '100%',
          alignItems: 'center',
          padding: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 20,
          ...styles
        }}
        onPress={() => {
          switch (item.type) {
            case 'screen':
              navigation.dispatch(StackActions.push('SettingsGroup', item));
              useNavigationStore.getState().update(
                {
                  name: 'SettingsGroup',
                  title: typeof item.name === 'function' ? item.name(current) : item.name
                },
                true
              );
              break;
            case 'switch':
              onChangeSettings();
              break;
            default:
              item.modifer && item.modifer(current);
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
            {!!item.icon && (
              <Icon
                color={item.type === 'danger' ? colors.errorText : colors.icon}
                name={item.icon}
                size={30}
              />
            )}
          </View>

          <View
            style={{
              flexShrink: 1,
              paddingRight: item.type === 'switch' ? 10 : 0
            }}
          >
            <Paragraph
              color={item.type === 'danger' ? colors.errorText : colors.heading}
              size={SIZE.md + 1}
            >
              {typeof item.name === 'function' ? item.name(current) : item.name}
            </Paragraph>
            {!!item.description && (
              <Paragraph
                color={item.type === 'danger' ? colors.errorText : colors.pri}
                size={SIZE.sm}
              >
                {typeof item.description === 'function'
                  ? item.description(current)
                  : item.description}
              </Paragraph>
            )}

            {!!item.component && (
              <>
                <Seperator half />
                {components[item.component]}
              </>
            )}
          </View>
        </View>

        {item.type === 'switch' && item.property && (
          <ToggleSwitch
            isOn={item.getter ? item.getter(item.property || current) : settings[item.property]}
            onColor={colors.accent}
            offColor={colors.icon}
            size="small"
            animationSpeed={150}
            onToggle={onChangeSettings}
          />
        )}
      </PressableButton>
    );
  },
  () => true
);
