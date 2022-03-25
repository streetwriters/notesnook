import React from 'react';
import { TabsHolder } from './tabs-holder';
import DialogProvider from '../components/dialog-provider';
import { Toast } from '../components/toast';

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
