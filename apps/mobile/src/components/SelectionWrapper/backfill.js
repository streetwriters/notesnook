import React from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import { useEditorStore } from '../../provider/stores';
import {hexToRGBA} from '../../utils/ColorUtils';
import {SIZE} from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';

export const Filler = ({item, background}) => {
  const [state] = useTracked();
  const {colors} = state;
  
  const currentEditingNote = useEditorStore(state => state.currentEditingNote);

  const color = 'gray';

  return (
    <View
      style={{
        position: 'absolute',
        width: '110%',
        height: '150%',
        backgroundColor:currentEditingNote === item.id ?  hexToRGBA(colors[color], 0.12) : null,
        borderLeftWidth:5,
        borderLeftColor:currentEditingNote === item.id ?  colors[item.color || 'accent'] : 'transparent'
      }}>
       
        
    </View>
  );
};
