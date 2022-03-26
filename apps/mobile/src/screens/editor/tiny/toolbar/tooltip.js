import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../../services/event-manager';
import { useThemeStore } from '../../../../stores/theme';
import layoutmanager from '../../../../utils/layout-manager';
import { normalize } from '../../../../utils/size';
import { EditorWebView } from '../../Functions';
import { editorState } from '../../tiptap/utils';
import tiny from '../tiny';
import ColorGroup from './colorgroup';
import { properties } from './constants';
import ToolbarItem from './item';
import ToolbarLinkInput from './linkinput';

const Tooltip = () => {
  const colors = useThemeStore(state => state.colors);
  const [group, setGroup] = useState(null);
  const isColorGroup = /^(hilitecolor|forecolor|)$/.test(group?.type);
  const isInputTooltip = /^(link|video|)$/.test(group?.type);

  useEffect(() => {
    eSubscribeEvent('showTooltip', show);
    return () => {
      eUnSubscribeEvent('showTooltip', show);
    };
  }, [group]);

  const show = async data => {
    properties.userBlur = true;
    if (!data) {
      editorState().tooltip = null;
      if (group) {
        layoutmanager.withAnimation(150);
        setGroup(null);
      }
      return;
    }
    if (!data) return;
    editorState().tooltip = data.title;
    if (!data.type) {
      data.type = data.title;
    }
    layoutmanager.withSpringAnimation(200);
    setGroup(data);
    setTimeout(() => {
      if (editorState().tooltip !== 'link') {
        properties.pauseSelectionChange = false;
      }
      tiny.call(
        EditorWebView,
        `tinyMCE.activeEditor.selection.getNode().scrollIntoView({behavior: 'smooth', block: 'nearest'});`
      );
    }, 210);
  };

  let style = {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    minHeight: normalize(50),
    backgroundColor: colors.bg,
    alignSelf: 'center',
    flexDirection: 'row',
    zIndex: 10,
    marginBottom: 0,
    paddingHorizontal: 2
  };

  const ParentElement = props => (
    <View style={style}>
      {group && /^(link|table|ul|align)$/.test(group.type) ? (
        <View
          style={{
            justifyContent: 'space-around',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%',
            backgroundColor: colors.bg,
            marginVertical: 2,
            borderRadius: 5
          }}
        >
          {props.children}
        </View>
      ) : (
        <ScrollView
          style={{
            backgroundColor: colors.bg,
            marginVertical: 2,
            borderRadius: 5,
            paddingHorizontal: 0
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{
            justifyContent: 'space-around',
            alignItems: 'center',
            flexDirection: 'row',
            minWidth: '100%'
          }}
        >
          {props.children}
        </ScrollView>
      )}
    </View>
  );

  return !group || !group?.type ? null : (
    <ParentElement>
      {isInputTooltip ? (
        <ToolbarLinkInput
          format={group.type}
          setVisible={() => {
            show();
          }}
          type={group.type}
          value={group.value}
        />
      ) : null}

      {isColorGroup ? <ColorGroup group={group} /> : null}

      {!isColorGroup && !isInputTooltip
        ? group.data.map(item => (
            <ToolbarItem
              key={item.formatValue || item.format}
              format={item.format}
              formatValue={item.formatValue}
              type={item.type}
              showTitle={item.showTitle}
              premium={item.premium}
              groupFormat={group.title}
              groupDefault={group.default}
              text={item.text}
              fullname={item.fullname}
            />
          ))
        : null}
    </ParentElement>
  );
};

export default Tooltip;
