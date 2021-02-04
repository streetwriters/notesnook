import React, {useEffect} from 'react';
import {View} from 'react-native';
import {ScrollView} from 'react-native';
import {useTracked} from '../../../../provider';
import {eSendEvent} from '../../../../services/EventManager';
import {TOOLBAR_CONFIG} from './config';
import {properties} from './constants';
import ToolbarGroup from './group';
import Tooltip from './tooltip';

const EditorToolbar = React.memo(
  () => {
    const [state] = useTracked();
    const {colors} = state;
    const config = TOOLBAR_CONFIG;

    useEffect(() => {
      properties.selection = {};
      return () => {
        properties.selection = {};
      };
    }, []);

    return (
      <>
        <Tooltip />
        <ScrollView
          style={{
            width: '100%',
            maxWidth: '100%',
            minHeight: 50,
            borderTopWidth: 1,
            borderTopColor: colors.nav,
            paddingLeft: 12,
          }}
          onScrollBeginDrag={() => {
            eSendEvent('showTooltip');
          }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {config.map((item, index) => (
            <ToolbarGroup key={item[0].format} group={item} />
          ))}
        </ScrollView>
      </>
    );
  },
  () => true,
);

export default EditorToolbar;
