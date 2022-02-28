import React, { useEffect } from 'react';
import { Platform, View, ScrollView } from 'react-native';
import { IconButton } from '../../../../components/ui/icon-button';
import { useTracked } from '../../../../provider';
import { useEditorStore } from '../../../../provider/stores';
import { getElevation } from '../../../../utils';
import { db } from '../../../../utils/database';
import { normalize } from '../../../../utils/size';
import { EditorWebView, getNote, setNoteOnly } from '../../Functions';
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
    const readonly = useEditorStore(state => state.readonly);
    const setReadonly = useEditorStore(state => state.setReadonly);

    useEffect(() => {
      properties.selection = {};
      return () => {
        properties.selection = {};
      };
    }, []);

    const onPress = async () => {
      if (getNote()) {
        await db.notes.note(getNote().id).readonly();
        setNoteOnly(db.notes.note(getNote().id).data);
        tiny.call(EditorWebView, tiny.toogleReadMode('design'));
        setReadonly(false);
      }
    };

    return (
      <>
        <View
          style={{
            width: '100%',
            minHeight: normalize(50)
          }}
        >
          {readonly ? (
            <IconButton
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
