/* eslint-disable @typescript-eslint/no-var-requires */
import './globals.js';
import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';


const ShareProvider = () => {
    NotesnookShare = require('../share/index').default;
    return Platform.OS === 'ios' ? (
      <SafeAreaProvider>
        <NotesnookShare quicknote={false} />
      </SafeAreaProvider>
    ) : (
      <NotesnookShare quicknote={false} />
    );
  };
AppRegistry.registerComponent('NotesnookShare', () => ShareProvider);

