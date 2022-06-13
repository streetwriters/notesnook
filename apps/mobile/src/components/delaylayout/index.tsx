import React from 'react';
import { ViewProps } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
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
  const loading = useDelayLayout(props.delay || 300);

  const Placeholder = placeholder[props.type || 'default'];

  return loading || props.wait ? (
    <Animated.View
      exiting={FadeOut}
      style={{
        backgroundColor: colors.bg,
        flex: 1,
        paddingTop: 20
      }}
    >
      <Placeholder />
    </Animated.View>
  ) : (
    <>{props.children}</>
  );
}
