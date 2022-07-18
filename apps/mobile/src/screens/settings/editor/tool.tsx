import * as React from 'react';
import { View } from 'react-native';
import { DraxDragWithReceiverEventData, DraxView } from 'react-native-drax';
import Animated, { Layout } from 'react-native-reanimated';
import { presentDialog } from '../../../components/dialog/functions';
import { IconButton } from '../../../components/ui/icon-button';
import { SvgView } from '../../../components/ui/svg';
import Paragraph from '../../../components/ui/typography/paragraph';
import { useThemeStore } from '../../../stores/use-theme-store';
import { getElevation } from '../../../utils';
import { SIZE } from '../../../utils/size';
import { renderGroup } from './common';
import { DraggableItem, useDragState } from './state';
import { findToolById, getToolIcon } from './toolbar-definition';
import ToolSheet from './tool-sheet';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
export const Tool = ({ item, index, groupIndex, parentIndex }: DraggableItem) => {
  const setData = useDragState(state => state.setData);
  const [dragged, setDragged] = useDragState(state => [state.dragged, state.setDragged]);
  const [recieving, setRecieving] = React.useState(false);
  const [recievePosition, setRecievePosition] = React.useState('above');
  const colors = useThemeStore(state => state.colors);
  const isSubgroup = typeof item === 'object';
  const isDragged =
    dragged &&
    dragged.item &&
    ((dragged.type === 'tool' && dragged?.item === item) ||
      (isSubgroup && dragged?.item[0] === item[0]));

  const dimensions = React.useRef({
    height: 0,
    width: 0
  });
  //@ts-ignore
  const tool = isSubgroup || item === 'dummy' ? null : findToolById(item);
  //@ts-ignore
  const iconSvgString = isSubgroup || !tool ? null : getToolIcon(tool.icon);

  const buttons = isSubgroup
    ? [
        {
          name: 'minus',
          onPress: () => {
            presentDialog({
              context: 'global',
              title: 'Delete collapsed section?',
              positiveText: 'Delete',
              paragraph: 'All tools in the collapsed section will also be removed.',
              positivePress: () => {
                if (!groupIndex) return;
                const _data = useDragState.getState().data.slice();
                _data[groupIndex].splice(index, 1);
                setData(_data);
              }
            });
          }
        },
        {
          name: 'plus',
          onPress: () => {
            ToolSheet.present({
              item,
              index,
              groupIndex,
              parentIndex
            });
          }
        }
      ]
    : [
        {
          name: 'minus',
          onPress: () => {
            if (!groupIndex) return;
            const _data = useDragState.getState().data.slice();
            if (!parentIndex) {
              const index = _data[groupIndex].findIndex(tool => tool === item);
              _data[groupIndex].splice(index, 1);
            } else {
              //@ts-ignore
              const index = _data[parentIndex][groupIndex].findIndex(tool => tool === item);
              _data[parentIndex][groupIndex].splice(index, 1);
            }
            console.log(_data[groupIndex]);
            setData(_data);
          }
        }
      ];

  if (parentIndex === undefined && !isSubgroup) {
    buttons.unshift({
      name: 'unfold-less-horizontal',
      onPress: () => {
        if (groupIndex === undefined) return;
        const _data = useDragState.getState().data.slice();
        const hasSubGroup = Array.isArray(_data[groupIndex][_data[groupIndex].length - 1]);
        const _item = _data[groupIndex].splice(index, 1)[0];
        if (hasSubGroup) {
          const subgroup = _data[groupIndex][_data[groupIndex].length - 1] as string[];
          //@ts-ignore
          subgroup.unshift(_item);
        } else {
          _data[groupIndex].push([]);
          //@ts-ignore
          _data[groupIndex][_data[groupIndex].length - 1].unshift(_item);
        }

        setData(_data);
      }
    });
  }

  const renderChild = React.useCallback(
    (hover?: boolean) => (
      <>
        <View
          onLayout={event => {
            if (hover) return;
            if (!isDragged) dimensions.current = event.nativeEvent.layout;
          }}
          style={{
            backgroundColor: isSubgroup ? colors.bg : colors.nav,
            borderWidth: isSubgroup ? 0 : 1,
            borderColor: isSubgroup ? undefined : colors.nav,
            marginBottom: 10,
            width: isDragged ? dimensions.current.width : '100%',
            paddingTop: isSubgroup ? 15 : 0,
            height: 40,
            paddingHorizontal: isSubgroup ? 0 : 12,
            paddingRight: 0,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: isSubgroup ? 30 : 12,
            ...getElevation(hover ? 3 : 0)
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            {!isSubgroup && iconSvgString ? (
              <SvgView width={23} height={23} src={iconSvgString} />
            ) : null}
            {isSubgroup && (
              <Icon style={{ marginRight: 5 }} size={SIZE.md} name="drag" color={colors.icon} />
            )}
            <Paragraph
              style={{
                marginLeft: iconSvgString ? 10 : 0
              }}
              color={isSubgroup ? colors.icon : colors.pri}
              size={isSubgroup ? SIZE.xs : SIZE.sm - 1}
            >
              {isSubgroup ? 'COLLAPSED' : tool?.title}
            </Paragraph>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            {buttons.map(item => (
              <IconButton
                top={0}
                left={0}
                bottom={0}
                right={0}
                key={item.name}
                onPress={item.onPress}
                style={{
                  marginLeft: 10
                }}
                name={item.name}
                color={colors.icon}
                size={SIZE.lg}
              />
            ))}
          </View>
        </View>

        {isSubgroup && !isDragged ? (
          <View
            style={{
              paddingLeft: 30
            }}
          >
            {renderGroup({ index, item, parentIndex: groupIndex })}
          </View>
        ) : null}
      </>
    ),
    []
  );

  const onDrop = (data: DraxDragWithReceiverEventData) => {
    const isDroppedAbove = data.receiver.receiveOffsetRatio.y < 0.5;
    const dragged = data.dragged.payload;
    const reciever = data.receiver.payload;
    let _data = useDragState.getState().data.slice();

    const isFromSubgroup = typeof dragged.parentIndex === 'number';
    const isDroppedAtSubgroup = typeof reciever.parentIndex === 'number';

    if (dragged.type === 'tool') {
      const fromIndex = dragged.index;
      const toIndex = isDroppedAbove ? Math.max(0, reciever.index) : reciever.index + 1;

      console.log('indexes', reciever.parentIndex, reciever.groupIndex);

      const insertAt = isDroppedAtSubgroup
        ? (_data[reciever.parentIndex][reciever.groupIndex] as string[])
        : (_data[reciever.groupIndex] as string[]);
      const insertFrom = isFromSubgroup
        ? (_data[dragged.parentIndex][dragged.groupIndex] as string[])
        : (_data[dragged.groupIndex] as string[]);
      insertAt.splice(
        toIndex > fromIndex ? toIndex - 1 : toIndex,
        0,
        insertFrom.splice(fromIndex, 1)[0]
      );

      // Remove the group or subgroup if it is empty.
      if (insertFrom.length === 0) {
        isFromSubgroup
          ? _data[dragged.parentIndex].splice(_data[dragged.parentIndex].length - 1, 1)
          : _data.splice(dragged.groupIndex, 1);
      }
    }

    setData(_data);
    setRecieving(false);
    return data.dragAbsolutePosition;
  };

  const onRecieveData = (data: DraxDragWithReceiverEventData) => {
    setRecieving(true);
    if (data.receiver.receiveOffsetRatio.y < 0.5) {
      setRecievePosition('above');
    } else {
      setRecievePosition('below');
    }
  };

  return (
    <Animated.View layout={Layout}>
      <DraxView
        payload={{
          item,
          index,
          groupIndex,
          type: isSubgroup ? 'subgroup' : 'tool',
          parentIndex
        }}
        receptive={
          dragged.type === 'group' ||
          (dragged.type !== 'tool' && isSubgroup) ||
          (dragged.type === 'tool' && isSubgroup) ||
          (!isSubgroup && dragged.type === 'subgroup') ||
          (dragged.item && dragged.item?.indexOf(item as string) > -1)
            ? false
            : true
        }
        longPressDelay={500}
        onDragStart={() => {
          setDragged({
            item,
            type: isSubgroup ? 'subgroup' : 'tool',
            ...dimensions.current,
            groupIndex: groupIndex
          });
        }}
        receivingStyle={{
          paddingBottom: recievePosition === 'below' ? 50 : 0,
          paddingTop: recievePosition === 'above' ? 50 : 0,
          backgroundColor: dragged.type === 'subgroup' ? colors.nav : undefined,
          marginTop: recievePosition === 'above' ? 5 : 0,
          marginBottom: recievePosition === 'below' ? 5 : 0,
          borderRadius: 10
        }}
        renderHoverContent={() => renderChild(true)}
        draggable={item !== 'dummy'}
        onDragDrop={data => {
          setDragged({});
        }}
        onDragEnd={data => {
          setDragged({});
        }}
        hoverDragReleasedStyle={{
          opacity: 0
        }}
        onReceiveDragDrop={onDrop}
        onReceiveDragOver={onRecieveData}
        onReceiveDragExit={() => {
          setRecieving(false);
        }}
        onReceiveDragEnter={onRecieveData}
      >
        {isDragged || item === 'dummy' ? (
          <View
            style={{
              width: '100%',
              height: item === 'dummy' ? 10 : 0
            }}
          />
        ) : (
          renderChild()
        )}
      </DraxView>
    </Animated.View>
  );
};
