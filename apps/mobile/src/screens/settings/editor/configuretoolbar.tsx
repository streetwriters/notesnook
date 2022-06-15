import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { DraxProvider, DraxScrollView } from 'react-native-drax';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Button } from '../../../components/ui/button';
import { Notice } from '../../../components/ui/notice';
import Paragraph from '../../../components/ui/typography/paragraph';
import { useThemeStore } from '../../../stores/use-theme-store';
import { SIZE } from '../../../utils/size';
import { Group } from './group';
import { useDragState } from './state';

export const ConfigureToolbar = () => {
  const data = useDragState(state => state.data);
  const preset = useDragState(state => state.preset);
  const colors = useThemeStore(state => state.colors);

  const renderGroups = () => {
    return data.map((item, index) => <Group key={`group-${index}`} item={item} index={index} />);
  };

  return (
    <DraxProvider>
      <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.container}>
        <View
          style={{
            paddingVertical: 12
          }}
        >
          <Notice
            text="Curate the toolbar that fits your needs and matches your personality."
            type="information"
          />

          <Paragraph
            style={{
              marginTop: 10
            }}
            size={SIZE.xs}
            color={colors.icon}
          >
            PRESETS
          </Paragraph>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              width: '100%',
              marginTop: 10
            }}
          >
            {[
              {
                id: 'default',
                name: 'Default'
              },
              {
                id: 'minimal',
                name: 'Minimal'
              },
              {
                id: 'custom',
                name: 'Custom'
              }
            ].map(item => (
              <Button
                type={preset === item.id ? 'accent' : 'grayAccent'}
                style={{
                  borderRadius: 100,
                  height: 35,
                  marginRight: 10
                }}
                onPress={() => {
                  //@ts-ignore
                  useDragState.getState().setPreset(item.id);
                }}
                fontSize={SIZE.sm - 1}
                key={item.name}
                title={item.name}
              />
            ))}
          </View>
        </View>
        <DraxScrollView>
          {renderGroups()}
          <View
            style={{
              height: 500
            }}
          >
            <Button
              title="Create a group"
              type="grayAccent"
              icon="plus"
              style={{
                width: '100%'
              }}
              onPress={() => {
                const _data = data.slice();
                _data.push([]);
                useDragState.getState().setData(_data);
              }}
            />
          </View>
        </DraxScrollView>
      </Animated.View>
    </DraxProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    width: '100%'
  }
});

// import React, { useEffect, useState } from 'react';
// import { StyleSheet, Text, TouchableOpacity } from 'react-native';
// import DraggableFlatList, {
//   RenderItemParams,
//   ScaleDecorator
// } from 'react-native-draggable-flatlist';
// import { useThemeStore } from '../../stores/use-theme-store';
// import {
//   FlattenedToolbarItemType,
//   getFlattenedToolbarDefinition,
//   getToolbarDefinition,
//   moveGroup,
//   moveSubGroup,
//   moveTool,
//   toolbarDefinition
// } from './toolbar-definition';
// /**
//  *
//  * Flatten toolbar definition array with headers for each group.
//  * Add them to list
//  * Each list item gets it's data from tools
//  * reorder items.
//  * Save reordered data to database/storage.
//  */

// const flattened = getFlattenedToolbarDefinition(toolbarDefinition);
// export function ConfigureToolbar() {
//   const [data, setData] = useState(flattened);
//   const colors = useThemeStore(state => state.colors);

//   useEffect(() => {
//     console.log(getToolbarDefinition(data));
//   }, [data]);

//   const onDragEnd = React.useCallback(
//     ({ data: _data, from, to }) => {
//       console.log(from, to);
//       let prevDraggedItem = data[from];
//       let nextDraggedItem = _data[to];

//       switch (prevDraggedItem.type) {
//         case 'group':
//           _data = moveGroup(data, _data, to, from, prevDraggedItem, nextDraggedItem);
//           break;
//         case 'subgroup':
//           _data = moveSubGroup(data, _data, to, from, prevDraggedItem, nextDraggedItem);
//           break;
//         case 'tool':
//           _data = moveTool(data, _data, to, from, prevDraggedItem, nextDraggedItem);
//           break;
//       }

//       setData(_data);
//     },
//     [data]
//   );

//   const renderItem = React.useCallback(
//     ({ item, drag, isActive }: RenderItemParams<FlattenedToolbarItemType>) => {
//       return (
//         <ScaleDecorator>
//           <TouchableOpacity
//             onLongPress={drag}
//             disabled={isActive}
//             style={[
//               styles.rowItem,
//               {
//                 backgroundColor: isActive ? colors.nav : colors.transGray,
//                 borderWidth: 1,
//                 borderColor: item.type === 'group' ? colors.accent : colors.nav
//               }
//             ]}
//           >
//             <Text style={styles.text}>
//               {item.title} - {item.groupId}
//             </Text>
//           </TouchableOpacity>
//         </ScaleDecorator>
//       );
//     },
//     []
//   );

//   return (
//     <DraggableFlatList
//       data={data}
//       onDragEnd={onDragEnd}
//       style={{
//         paddingHorizontal: 12
//       }}
//       keyExtractor={item => item.id}
//       renderItem={renderItem}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   rowItem: {
//     height: 50,
//     width: '100%',
//     justifyContent: 'center',
//     marginBottom: 10,
//     borderRadius: 10,
//     paddingHorizontal: 12
//   },
//   text: {
//     color: 'black',
//     fontSize: 16,
//     textAlign: 'left'
//   }
// });
