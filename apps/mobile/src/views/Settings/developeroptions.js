import React, {useState} from 'react';
import ToggleSwitch from 'toggle-switch-react-native';
import {useTracked} from '../../provider';
import {useSettingStore} from '../../provider/stores';
import SettingsService from '../../services/SettingsService';
import { CustomButton } from './button';
import SectionHeader from './section-header';

const SettingsDeveloperOptions = ({isSheet}) => {
  const [state] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);
  const [collapsed, setCollapsed] = useState(isSheet ? false : true);

  const toggleDevMode = () => {
    SettingsService.set('devMode', !settings.devMode);
  };

  const devModeList = [
    {
      name: 'Enable debug mode',
      func: toggleDevMode,
      desc: 'Show debug options on items',
      customComponent: (
        <ToggleSwitch
          isOn={settings.devMode}
          onColor={colors.accent}
          offColor={colors.icon}
          size="small"
          animationSpeed={150}
          onToggle={toggleDevMode}
        />
      )
    }
  ];

  return (
    <>
      {!isSheet && (
        <SectionHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          title="Developer Options"
        />
      )}

      {!collapsed && (
        <>
          {devModeList.map(item => (
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

export default SettingsDeveloperOptions;
