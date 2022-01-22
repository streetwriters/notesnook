import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActionIcon } from '../../components/ActionIcon';
import { Button } from '../../components/Button';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import { useTracked } from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  presentSheet
} from '../../services/EventManager';
import layoutmanager from '../../utils/layout-manager';
import { SIZE } from '../../utils/SizeUtils';
import { EditorWebView } from './Functions';
import tiny from './tiny/tiny';
import ColorItem from './tiny/toolbar/coloritem';
import { editor_colors, rgbToHex } from './tiny/toolbar/constants';

export const TableCellProperties = ({ data }) => {
  const [state] = useTracked();
  const { colors } = state;
  const [cellOptions, setCellOptions] = useState(data);
  console.log(data);

  const onUpdateCell = data => {
    layoutmanager.withSpringAnimation(500);
    setCellOptions(data);
  };

  useEffect(() => {
    eSubscribeEvent('updatecell', onUpdateCell);
    return () => {
      eUnSubscribeEvent('updatecell', onUpdateCell);
    };
  }, []);

  function increaseWidth() {
    let width = cellOptions.width;
    if (!width.includes('px')) width = '100px';
    width = width.slice(0, width.length - 2);
    width = parseFloat(width);
    width = width + 10;
    width = width + 'px';
    console.log(width, 'final');
    tiny.call(
      EditorWebView,
      `(function() {
        let node = editor.selection.getNode();
        node.style.width = "${width}";
        tableCellNodeOptions();
        editor.fire("input");
        })()`
    );
  }

  function decreaseWidth() {
    let width = cellOptions.width;
    if (!width.includes('px')) width = '100px';
    width = width.slice(0, width.length - 2);

    width = parseFloat(width);
    width = width - 10;
    width = width + 'px';
    tiny.call(
      EditorWebView,
      `(function() {
          let node = editor.selection.getNode();
          node.style.width = "${width}";
          tableCellNodeOptions();
          editor.fire("input");
        })()`
    );
  }

  function changeCellType(type) {
    tiny.call(
      EditorWebView,
      `
      tinymce.activeEditor.execCommand('mceTableCellType', false, { type: '${type}' });
      tableCellNodeOptions();
      editor.fire("input");
      `
    );
  }

  function changeColType(type) {
    tiny.call(
      EditorWebView,
      `
      tinymce.activeEditor.execCommand('mceTableColType', false, { type: '${type}' });
      tableCellNodeOptions();
      editor.fire("input");
      `
    );
  }

  return (
    <View
      style={{
        paddingHorizontal: 12
      }}
    >
      <Heading size={SIZE.md}>Column Width</Heading>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 5,
          height: 50
        }}
      >
        <Paragraph size={SIZE.md + 2} color={colors.icon}>
          {cellOptions?.width}
        </Paragraph>

        <View
          style={{
            flexDirection: 'row'
          }}
        >
          <ActionIcon
            customStyle={{
              marginRight: 10
            }}
            onPress={increaseWidth}
            type="grayBg"
            name="plus"
            size={SIZE.lg}
            color={colors.accent}
          />

          <ActionIcon
            onPress={decreaseWidth}
            type="grayBg"
            name="minus"
            size={SIZE.lg}
            color={colors.accent}
          />
        </View>
      </View>

      <Heading
        style={{
          marginBottom: 10
        }}
        size={SIZE.md}
      >
        Cell type
      </Heading>

      <View
        style={{
          flexDirection: 'row',
          marginBottom: 10
        }}
      >
        <Button
          type={cellOptions.cellType === 'th' ? 'shade' : 'grayBg'}
          icon={cellOptions.cellType === 'th' && 'check'}
          height={40}
          onPress={() => {
            changeCellType('th');
          }}
          style={{
            marginRight: 10
          }}
          title="Header"
        />

        <Button
          type={cellOptions.cellType === 'td' ? 'shade' : 'grayBg'}
          icon={cellOptions.cellType === 'td' && 'check'}
          height={40}
          onPress={() => {
            changeCellType('td');
          }}
          style={{
            marginRight: 10
          }}
          title="Body"
        />
      </View>

      <Heading
        style={{
          marginBottom: 10
        }}
        size={SIZE.md}
      >
        Column type
      </Heading>

      <View
        style={{
          flexDirection: 'row',
          marginBottom: 10
        }}
      >
        <Button
          type={cellOptions.colType === 'th' ? 'shade' : 'grayBg'}
          icon={cellOptions.colType === 'th' && 'check'}
          height={40}
          onPress={() => {
            changeColType('th');
          }}
          style={{
            marginRight: 10
          }}
          title="Header"
        />

        <Button
          type={cellOptions.colType === 'td' ? 'shade' : 'grayBg'}
          icon={cellOptions.colType === 'td' && 'check'}
          height={40}
          onPress={() => {
            changeColType('td');
          }}
          style={{
            marginRight: 10
          }}
          title="Body"
        />
      </View>
      <Heading size={SIZE.md}>Cell background color(${cellOptions.backgroundColor})</Heading>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexDirection: 'row',
          marginTop: 10
        }}
      >
        {editor_colors.map(item => (
          <ColorItem
            value={item}
            key={item}
            checked={item === rgbToHex(cellOptions.backgroundColor)}
            onCustomPress={color => {
              tiny.call(
                EditorWebView,
                `(function() {
                    let node = editor.selection.getNode();
                    node.style.backgroundColor = "${color}";
                    tableCellNodeOptions();
                    editor.fire("input");
                  })()`
              );
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
};
TableCellProperties.isPresented = false;
TableCellProperties.present = async data => {
  eSendEvent('updatecell', data);
  if (TableCellProperties.isPresented) return;
  TableCellProperties.isPresented = true;
  presentSheet({
    component: <TableCellProperties data={data} />,
    onClose: () => {
      TableCellProperties.isPresented = false;
    },
    editor: true
  });
};
