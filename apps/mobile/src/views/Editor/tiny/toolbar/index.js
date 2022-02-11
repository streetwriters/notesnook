import React, { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { ActionIcon } from '../../../../components/ActionIcon';
import { useTracked } from '../../../../provider';
import { useEditorStore } from '../../../../provider/stores';
import { getElevation } from '../../../../utils';
import { normalize } from '../../../../utils/SizeUtils';
import { EditorWebView, getNote } from '../../Functions';
import HistoryComponent from '../../HistoryComponent';
import tiny from '../tiny';
import { TOOLBAR_CONFIG } from './config';
import { properties, toolbarRef } from './constants';
import ToolbarGroup from './group';
import SearcReplace from './searchreplace';
import Tooltip from './tooltip';

const EditorToolbar = React.memo(
  () => {
    const [state] = useTracked();
    const { colors } = state;
    const config = TOOLBAR_CONFIG;
    const searchReplace = useEditorStore(state => state.searchReplace);
    const currentEditingNote = useEditorStore(state => state.currentEditingNote);

    useEffect(() => {
      properties.selection = {};
      return () => {
        properties.selection = {};
      };
    }, []);

    const onPress = () => {
      // todo
      tiny.call(EditorWebView, tiny.toogleReadMode('design'));
    };

    return (
      <>
        <View
          style={{
            width: '100%',
            minHeight: normalize(50),
            position: 'relative'
          }}
        >
          {currentEditingNote && getNote()?.readonly ? (
            <ActionIcon
              name="pencil-lock"
              type="grayBg"
              onPress={onPress}
              color={colors.accent}
              customStyle={{
                position: 'absolute',
                bottom: 20,
                width: 60,
                height: 60,
                right: 12,
                ...getElevation(5)
              }}
            />
          ) : (
            <>
              {searchReplace ? (
                <SearcReplace />
              ) : (
                <>
                  <Tooltip />
                  <ScrollView
                    ref={toolbarRef}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      minHeight: normalize(50),
                      backgroundColor: colors.bg,
                      paddingLeft: 6,
                      zIndex: 11
                    }}
                    contentContainerStyle={{
                      alignItems: 'center'
                    }}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <HistoryComponent />
                    {config.map((item, index) =>
                      typeof item !== 'string' ? (
                        <ToolbarGroup key={item[0].format} group={item} />
                      ) : (
                        <View
                          style={{
                            height: 30,
                            width: 2,
                            marginHorizontal: 2,
                            backgroundColor: colors.nav
                          }}
                        />
                      )
                    )}
                  </ScrollView>
                </>
              )}
            </>
          )}
        </View>
      </>
    );
  },
  () => true
);

export default EditorToolbar;
