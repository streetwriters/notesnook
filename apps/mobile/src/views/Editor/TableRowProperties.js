import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {Button} from '../../components/Button';
import Heading from '../../components/Typography/Heading';
import {useTracked} from '../../provider';
import {eSendEvent, eSubscribeEvent, eUnSubscribeEvent, presentSheet} from '../../services/EventManager';
import { editing } from '../../utils';
import layoutmanager from '../../utils/layout-manager';
import {SIZE} from '../../utils/SizeUtils';
import {EditorWebView} from './Functions';
import tiny from './tiny/tiny';
import ColorItem from './tiny/toolbar/coloritem';
import {editor_colors, rgbToHex} from './tiny/toolbar/constants';

export const TableRowProperties = ({data}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [rowOptions, setRowOptions] = useState(data);
  console.log(data);

  const onUpdateRow = data => {
    layoutmanager.withSpringAnimation(500);
    setRowOptions(data);
  };

  useEffect(() => {
    eSubscribeEvent('updaterow', onUpdateRow);
    return () => {
      eUnSubscribeEvent('updaterow', onUpdateRow);
    };
  }, []);

  const changeRowType = type => {
    tiny.call(
      EditorWebView,
      `
      tinymce.activeEditor.execCommand('mceTableRowType', false, { type: '${type}' });
      tableRowNodeOptions();
      editor.fire("input");
      `
    );
  };

  return (
    <View
      style={{
        paddingHorizontal: 12
      }}>
      <Heading size={SIZE.md}>Row type</Heading>

      <View
        style={{
          flexDirection: 'row',
          marginVertical: 10
        }}>
        <Button
          type={rowOptions.rowType === 'header' ? 'shade' : 'grayBg'}
          icon={rowOptions.rowType === 'header' && 'check'}
          height={40}
          onPress={() => {
            changeRowType('header');
          }}
          style={{
            marginRight: 10
          }}
          title="Header"
        />

        <Button
          type={rowOptions.rowType === 'body' ? 'shade' : 'grayBg'}
          icon={rowOptions.rowType === 'body' && 'check'}
          height={40}
          onPress={() => {
            changeRowType('body');
          }}
          style={{
            marginRight: 10
          }}
          title="Body"
        />

        <Button
          type={rowOptions.rowType === 'footer' ? 'shade' : 'grayBg'}
          icon={rowOptions.rowType === 'footer' && 'check'}
          height={40}
          onPress={() => {
            changeRowType('footer');
          }}
          style={{
            marginRight: 10
          }}
          title="Footer"
        />
      </View>

      <Heading size={SIZE.md}>Row background color</Heading>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexDirection: 'row',
          marginTop: 10
        }}>
        {editor_colors.map(item => (
          <ColorItem
            value={item}
            key={item}
            checked={item === rgbToHex(rowOptions.backgroundColor)}
            onCustomPress={color => {
              tiny.call(
                EditorWebView,
                `(function() {
                    let node = findNodeParent('tr');
                    if (node) {
                        node.style.backgroundColor = "${color}";
                        tableRowNodeOptions();
                        editor.fire("input");
                    }
                    
                  })()`
              );
            }}
          />
        ))}
      </ScrollView>

      <Heading
        style={{
          marginTop: 10
        }}
        size={SIZE.md}>
        Column background color
      </Heading>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexDirection: 'row',
          marginTop: 10
        }}>
        {editor_colors.map(item => (
          <ColorItem
            value={item}
            key={item}
            onCustomPress={color => {
              tiny.call(
                EditorWebView,
                `(function() {
                    let node = findNodeParent('table');
                    if (node) {
                        node.childNodes.forEach(n => {
                            if (n.childNodes && n.childNodes.length > 0) {
                              n.childNodes.forEach(n => {
                                if (n.childNodes && n.childNodes.length > 0) {
                                  n.childNodes[0].style.backgroundColor = '${color}';
                                }
                              });
                            }
                          });
                    }
                    
                  })()`
              );
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
};
TableRowProperties.isPresented = false;
TableRowProperties.present = data => {
  eSendEvent('updatecell', data);
  if (TableRowProperties.isPresented) return;
  let refocus = false;
  if (editing.keyboardState) {
    tiny.call(EditorWebView,tiny.cacheRange);
    tiny.call(EditorWebView,tiny.blur);
    refocus = true;
  }
  TableRowProperties.isPresented = true;
  presentSheet({
    component: <TableRowProperties data={data} />,
    onClose: () => {
      TableRowProperties.isPresented = false;
      if (!refocus) return;
      tiny.call(EditorWebView,tiny.focusEditor);
      tiny.call(EditorWebView,tiny.restoreRange);
      tiny.call(EditorWebView,tiny.clearRange);
    }
  });
};
