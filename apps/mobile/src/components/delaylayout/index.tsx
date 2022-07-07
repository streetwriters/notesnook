import React from 'react';
import { View, ViewProps } from 'react-native';
import { useThemeStore } from '../../stores/use-theme-store';
import { useDelayLayout } from '../../utils/hooks/use-delay-layout';
import { DefaultPlaceholder } from './default-placeholder';
import { SettingsPlaceholder } from './settings-placeholder';

interface IDelayLayoutProps extends ViewProps {
  delay?: number;
  wait?: boolean;
  type?: 'default' | 'settings';
}

const placeholder = {
  default: DefaultPlaceholder,
  settings: SettingsPlaceholder
};

export default function DelayLayout(props: IDelayLayoutProps) {
  const colors = useThemeStore(state => state.colors);
  const loading = useDelayLayout(!props.delay || props.delay < 300 ? 300 : props.delay);

  const Placeholder = placeholder[props.type || 'default'];

  return loading || props.wait ? (
    <View
      style={{
        backgroundColor: colors.bg,
        flex: 1,
        paddingTop: 20
      }}
    >
      <Placeholder />
    </View>
  ) : (
    <>{props.children}</>
  );
}
