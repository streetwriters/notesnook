import React from 'react';
import { View } from 'react-native';
import { useThemeStore } from '../../stores/use-theme-store';

export const SettingsPlaceholder = () => {
  const colors = useThemeStore(state => state.colors);

  return (
    <View>
      <View
        style={{
          width: 100,
          height: 12,
          backgroundColor: colors.shade,
          borderRadius: 5,
          marginLeft: 12,
          marginBottom: 12
        }}
      />
      <View
        style={{
          width: '100%',
          height: 60,
          borderRadius: 10,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.transGray,
            borderRadius: 100,
            marginRight: 20
          }}
        />
        <View>
          <View
            style={{
              width: 150,
              height: 12,
              backgroundColor: colors.nav,
              borderRadius: 5,
              marginBottom: 10
            }}
          />
          <View
            style={{
              width: 250,
              height: 16,
              backgroundColor: colors.nav,
              borderRadius: 5
            }}
          />
        </View>
      </View>

      <View
        style={{
          width: '100%',
          height: 60,
          borderRadius: 10,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.shade,
            borderRadius: 100,
            marginRight: 20
          }}
        />
        <View>
          <View
            style={{
              width: 150,
              height: 12,
              backgroundColor: colors.nav,
              borderRadius: 5,
              marginBottom: 10
            }}
          />
          <View
            style={{
              width: 250,
              height: 16,
              backgroundColor: colors.nav,
              borderRadius: 5
            }}
          />
        </View>

        <View
          style={{
            width: 40,
            height: 20,
            backgroundColor: colors.nav,
            borderRadius: 100,
            marginLeft: 15,
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingHorizontal: 4
          }}
        >
          <View
            style={{
              width: 15,
              height: 15,
              backgroundColor: colors.shade,
              borderRadius: 100,
              marginLeft: 15
            }}
          />
        </View>
      </View>
    </View>
  );
};
