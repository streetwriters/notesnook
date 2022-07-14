import React from 'react';
import { SafeAreaView } from 'react-native';
import DelayLayout from '../components/delay-layout';
import DialogProvider from '../components/dialog-provider';
import { Header } from '../components/header';
import { Toast } from '../components/toast';
import { useNoteStore } from '../stores/use-notes-store';
import { useSettingStore } from '../stores/use-setting-store';
import { TabsHolder } from './tabs-holder';

export const ApplicationHolder = React.memo(
  () => {
    const loading = useNoteStore(state => state.loading);
    const introCompleted = useSettingStore(state => state.settings.introCompleted);
    return loading && introCompleted ? (
      <>
        <SafeAreaView>
          <Header />
          <DelayLayout animated={false} wait={loading} />
        </SafeAreaView>
      </>
    ) : (
      <>
        <TabsHolder />
        <Toast />
        <DialogProvider />
      </>
    );
  },
  () => true
);
