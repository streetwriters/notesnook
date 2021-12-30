import React, {useEffect, useState} from 'react';
import {ScrollView, View, TouchableOpacity} from 'react-native';
import Animated, {Easing, timing} from 'react-native-reanimated';
import {PressableButton} from '../../../../components/PressableButton';
import Heading from '../../../../components/Typography/Heading';
import Paragraph from '../../../../components/Typography/Paragraph';
import {useTracked} from '../../../../provider';
import {DDS} from '../../../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../../../services/EventManager';
import {editing, getElevation} from '../../../../utils';
import {normalize, SIZE} from '../../../../utils/SizeUtils';
import {sleep} from '../../../../utils/TimeUtils';
import {EditorWebView} from '../../Functions';
import tiny from '../tiny';
import ColorGroup from './colorgroup';
import {execCommands} from './commands';
import {formatSelection, properties} from './constants';
import ToolbarItem from './item';
import ToolbarLinkInput from './linkinput';

let translateValue = new Animated.Value(400);
let animating = false;
function animate(val, time = 200) {
  if (animating) return;
  timing(translateValue, {
    toValue: val,
    duration: time,
    easing: Easing.in(Easing.ease)
  }).start(async () => {
    await sleep(time);
    animating = false;
  });
}

const Tooltip = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [group, setGroup] = useState({
    data: [],
    title: null,
    default: null,
    type: null
  });
  const floating = group?.type === 'table' || DDS.isTab;

  useEffect(() => {
    eSubscribeEvent('showTooltip', show);
    return () => {
      eUnSubscribeEvent('showTooltip', show);
    };
  }, []);

  const show = async data => {
    console.log(data);
    properties.userBlur = true;
    if (!data) {
      editing.tooltip = null;
      animate(100, 100);
      await sleep(100);
      setGroup(null);
      return;
    }
    if (!data) return;

    let time = editing.tooltip === 'table' || data.type === 'table' ? 400 : 110;

    if (data && editing.tooltip && editing.tooltip !== data.type) {
      let translate =
        editing.tooltip === 'table' || data.type === 'table' ? 400 : 0;
      animate(translate, time);
      await sleep(time);
    }
    editing.tooltip = data.title;
    if (!data.type) {
      data.type = data.title;
    }
    setGroup(data);
    await sleep(5);
    animate(0, time);
    setTimeout(() => {
      tiny.call(
        EditorWebView,
        `tinyMCE.activeEditor.selection.getNode().scrollIntoView({behavior: 'smooth', block: 'nearest'});`
      );
    }, 100);
    if (editing.tooltip !== 'link') {
      properties.pauseSelectionChange = false;
    }
  };
  console.log(group?.type);

  let style = {
    padding: floating ? 5 : 0,
    borderRadius: floating ? 5 : 0,
    overflow: 'hidden',
    display: !group || !group?.type ? 'none' : 'flex',
    position: floating ? 'absolute' : 'relative',
    bottom: floating ? 50 : null,
    width: group?.type === 'table' ? 45 * 5 + 15 : floating ? '100%' : '100%',
    minHeight: normalize(50),
    backgroundColor: colors.bg,
    alignSelf: 'center',
    flexDirection: 'row',
    borderWidth: floating ? 1 : 0,
    borderColor: floating && colors.nav,
    zIndex: 10,
    marginBottom: 0,
    paddingHorizontal: 2,
    transform: [
      {
        translateY: translateValue
      }
    ]
  };

  let ParentElement = props => (
    <Animated.View style={style}>
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
          children={props.children}></View>
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
          children={props.children}
        />
      )}
    </Animated.View>
  );

  function getRowColumns(index) {
    let columnCount = 5;
    let rowNumber = Math.floor(index / columnCount);
    let columnNumber = index - rowNumber * columnCount;

    return `${rowNumber + 1} x ${columnNumber + 1}`;
  }

  return (
    <ParentElement>
      {group && !group.data && /^(link|video|)$/.test(group.type) && (
        <ToolbarLinkInput
          format={group.type}
          setVisible={() => {
            show();
          }}
          type={group.type}
          value={group.value}
        />
      )}

      {!group?.data && group?.type === 'table' && (
        <View>
          <Heading
            size={SIZE.sm}
            style={{
              alignSelf: 'center',
              marginBottom: 5
            }}>
            Select rows x columns
          </Heading>
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              flexWrap: 'wrap',
              zIndex: 10
            }}>
            {[
              1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
              20, 21, 22, 23, 24, 25
            ].map((item, index) => (
              <PressableButton
                key={item.toString()}
                onPress={() => {
                  let columnCount = 5;
                  let rowNumber = Math.floor(index / columnCount);
                  let columnNumber = index - rowNumber * columnCount;
                  formatSelection(
                    execCommands.table(rowNumber + 1, columnNumber + 1)
                  );
                  eSendEvent('showTooltip');
                }}
                type="gray"
                customStyle={{
                  width: 35,
                  height: 25,
                  borderWidth: 1,
                  borderColor: colors.icon,
                  marginHorizontal: 5,
                  marginVertical: 5,
                  borderRadius: 2.5
                }}>
                <Paragraph size={SIZE.xs} color={colors.icon}>
                  {getRowColumns(index)}
                </Paragraph>
              </PressableButton>
            ))}
          </View>
        </View>
      )}

      {/^(hilitecolor|forecolor|)$/.test(group?.type) ? (
        <ColorGroup group={group} />
      ) : null}

      {group &&
        group.data &&
        /^(hilitecolor|forecolor|)$/.test(group.type) === false &&
        group.data.map(item =>
          /^(video|link|)$/.test(group.type) ? (
            <ToolbarLinkInput
              key={item.formatValue || item.format}
              setVisible={() => {
                show();
              }}
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
          )
        )}
    </ParentElement>
  );
};

export default Tooltip;
