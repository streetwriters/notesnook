import React, {useEffect, useState} from 'react';
import {Touchable} from 'react-native';
import {ScrollView, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Paragraph from '../../../../components/Typography/Paragraph';
import {useTracked} from '../../../../provider';
import {DDS} from '../../../../services/DeviceDetection';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  eSendEvent,
} from '../../../../services/EventManager';
import {dWidth, editing, getElevation} from '../../../../utils';
import ColorGroup from './colorgroup';
import {execCommands} from './commands';
import {formatSelection, properties} from './constants';
import ToolbarItem from './item';
import ToolbarLinkInput from './linkinput';

const Tooltip = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [group, setGroup] = useState({
    data: [],
    title: null,
    default: null,
    type: null,
  });
  const [visible, setVisible] = useState(false);
  const floating = group.type === 'table' || DDS.isTab;
  useEffect(() => {
    eSubscribeEvent('showTooltip', show);
    return () => {
      eUnSubscribeEvent('showTooltip', show);
    };
  }, []);

  const show = (data) => {
    properties.userBlur = true;
    if (!data) {
      console.log('hiding')
      setVisible(false);
      editing.tooltip = null;
      return;
    }
    setGroup(data);

    setVisible(true);
  };

  let ParentElement = (props) =>
    group.type === 'link' || group.type === 'table' || group.title === 'ul' || group.title === "align" ? (
      <View
        style={{
          borderRadius: floating ? 5 : 0,
          padding: floating ? 5 : 0,
          position: 'absolute',
          bottom: floating ? 60 : 50,
          width:
            group.type === 'table' ? 35 * 5 + 15 : floating ? '50%' : '100%',

          minHeight: 50,
          backgroundColor: colors.bg,
          alignSelf: 'center',
          flexDirection: 'row',
          borderWidth: floating ? 1 : 0,
          borderColor: floating && colors.nav,
          borderTopWidth: 1,
          borderTopColor: colors.nav,
          justifyContent: 'space-around',
          alignItems: 'center',
          flexDirection: 'row',

          ...getElevation(floating ? 5 : 0),
          zIndex: 999,
        }}
        children={props.children}
      />
    ) : (
      <ScrollView
        style={{
          borderRadius: floating ? 5 : 0,
          position: 'absolute',
          bottom: floating ? 60 : 50,
          width:
            group.type === 'table' ? 35 * 5 + 10 : floating ? '50%' : '100%',
          minHeight: 50,
          backgroundColor: colors.bg,
          alignSelf: 'center',
          flexDirection: 'row',
          borderWidth: floating ? 1 : 0,
          borderColor: floating && colors.nav,
          borderTopWidth: 1,
          borderTopColor: colors.nav,

          ...getElevation(floating ? 5 : 0),
          zIndex: 999,
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
          minWidth: '100%',
        }}
        children={props.children}
      />
    );
  return (
    visible && (
      <ParentElement>
        {!group.data && /^(link|video|)$/.test(group.type) && (
          <ToolbarLinkInput
            format={group.type}
            setVisible={setVisible}
            type={group.type}
            value={group.value}
          />
        )}

        {!group.data && group.type === 'table' && (
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}>
            {[
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
              10,
              11,
              12,
              13,
              14,
              15,
              16,
              17,
              18,
              19,
              20,
              21,
              22,
              23,
              24,
              25,
            ].map((item, index) => (
              <TouchableOpacity
                key={item.toString()}
                onPress={() => {
                  let columnCount = 5;
                  let rowNumber = Math.floor(index / columnCount);
                  let columnNumber = index - rowNumber * columnCount;
                  formatSelection(
                    execCommands.table(rowNumber + 1, columnNumber + 1),
                  );
                  eSendEvent('showTooltip');
                }}
                style={{
                  width: 25,
                  height: 25,
                  borderWidth: 1,
                  borderColor: colors.icon,
                  marginHorizontal: 5,
                  marginVertical: 5,
                }}
              />
            ))}
          </View>
        )}

        {/^(hilitecolor|forecolor|)$/.test(group.type) ? (
          <ColorGroup group={group} />
        ) : null}

        {group.data &&
          /^(hilitecolor|forecolor|)$/.test(group.type) === false &&
          group.data.map((item) =>
            group.type === 'link' || group.type === 'video' ? (
              <ToolbarLinkInput
                key={item.formatValue || item.format}
                setVisible={setVisible}
                format={item.format}
                type={item.type}
                showTitle={true}
                premium={item.premium}
                groupFormat={group.title}
                groupDefault={group.default}
                formatValue={item.formatValue}
                fullname={item.fullname}
              />
            ) : (
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
            ),
          )}
      </ParentElement>
    )
  );
};

export default Tooltip;
