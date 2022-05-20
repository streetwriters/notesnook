import React from 'react';
import DialogProvider from '../components/dialog-provider';
import { Toast } from '../components/toast';
import { TabsHolder } from './tabs-holder';

export const ApplicationHolder = React.memo(
  () => {
    return (
      <>
        <TabsHolder />
        <Toast />
        <DialogProvider />
      </>
    );
  },
  () => true
);
