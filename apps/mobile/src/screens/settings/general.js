import React, { useState } from 'react';
import ToggleSwitch from 'toggle-switch-react-native';
import { useThemeStore } from '../../stores/theme';
import { useSettingStore } from '../../stores/stores';
import Notifications from '../../services/notifications';
import SettingsService from '../../services/settings';
import { CustomButton } from './button';
import SectionHeader from './section-header';

export const SettingsGeneralOptions = ({ isSheet }) => {
  const colors = useThemeStore(state => state.colors);
  const settings = useSettingStore(state => state.settings);
  const [collapsed, setCollapsed] = useState(isSheet ? false : true);
  const toggleNotifNotes = () => {
    if (settings.notifNotes) {
      Notifications.unpinQuickNote();
    } else {
      Notifications.pinQuickNote();
    }
    SettingsService.set({ notifNotes: !settings.notifNotes });
  };

  const generalList = [
    {
      name: 'Notes in notifications',
      func: toggleNotifNotes,
      desc: 'Add quick notes from notifications without opening the app.',
      customComponent: (
        <ToggleSwitch
          isOn={settings.notifNotes}
          onColor={colors.accent}
          offColor={colors.icon}
          size="small"
          animationSpeed={150}
          onToggle={toggleNotifNotes}
        />
      )
    }
  ];

  return (
    <>
      {!isSheet && (
        <SectionHeader collapsed={collapsed} setCollapsed={setCollapsed} title="General" />
      )}

      {!collapsed && (
        <>
          {generalList.map(item => (
            <CustomButton
              key={item.name}
              title={item.name}
              tagline={item.desc}
              onPress={item.func}
              customComponent={item.customComponent}
            />
          ))}
        </>
      )}
    </>
  );
};

export default SettingsGeneralOptions;
