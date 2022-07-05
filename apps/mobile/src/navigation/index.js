import React from 'react';
import DelayLayout from '../components/delay-layout';
import DialogProvider from '../components/dialog-provider';
import { Header } from '../components/header';
import Intro from '../components/intro';
import { Toast } from '../components/toast';
import SettingsService from '../services/settings';
import { useNoteStore } from '../stores/use-notes-store';
import { TabsHolder } from './tabs-holder';

export const ApplicationHolder = React.memo(
  () => {
    const loading = useNoteStore(state => state.loading);
    const introCompleted = SettingsService.get().introCompleted;
    return loading && introCompleted ? (
      <>
        <Header />
        <DelayLayout wait={loading} />
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
