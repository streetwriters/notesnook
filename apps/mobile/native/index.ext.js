/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./globals"
import '../app/common/logger/index';

const ShareProvider = () => {
    NotesnookShare = require('../share/index').default;
    return Platform.OS === 'ios' ? (
      <SafeAreaProvider>
        <NotesnookShare />
      </SafeAreaProvider>
    ) : (
      <NotesnookShare  />
    );
  };

AppRegistry.registerComponent('NotesnookShare', () => ShareProvider);

