import React, { useEffect, useState } from 'react';
import { View,TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../../../provider';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../../services/EventManager';
import { normalize, SIZE } from '../../../../utils/SizeUtils';
import { formatSelection, properties, rgbToHex } from './constants';
import { execCommands } from './commands';

const ColorItem = ({value, format}) => {
	const [state] = useTracked();
	const {colors} = state;
	const [selected, setSelected] = useState(false);
  
	useEffect(() => {
	  eSubscribeEvent('onSelectionChange', onSelectionChange);
	  return () => {
		eUnSubscribeEvent('onSelectionChange', onSelectionChange);
	  };
	}, [selected]);
  
	useEffect(() => {
	  onSelectionChange(properties.selection);
	}, []);
  
	const onSelectionChange = (data) => {
	  if (properties.pauseSelectionChange) return;
	  checkForChanges(data);
	};
  
	const checkForChanges = (data) => {
	  properties.selection = data;
	  let formats = Object.keys(data);
	  let _color;
	  if (data[format] !== null) {

		if (data[format]?.startsWith('#')) {
		  _color = data[format];
		} else {
		  _color = rgbToHex(data[format]);
		}
	  }
	  if (formats.indexOf(format) > -1 && _color === value) {
		setSelected(true);
		return;
	  }
	  setSelected(false);
	};
  
	const onPress = () => {
	  if (selected) {
		formatSelection(format, null);
	  } else {
		formatSelection(execCommands[format](value));
	  }
	};
  
	return (
	  <TouchableOpacity
		onPress={onPress}
		activeOpacity={0.8}
		style={{
		  backgroundColor: value,
		  borderWidth: 1,
		  borderColor: colors.nav,
		  borderRadius: 5,
		  height:  normalize(40),
		  width:  normalize(40),
		  marginRight: 5,
		}}>
		<View
		  style={{
			height: 40,
			width: 40,
			borderRadius: 5,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: selected ? 'rgba(0,0,0,0.1)' : 'transparent',
		  }}>
		  {selected && <Icon name="check" size={SIZE.lg} color="white" />}
		</View>
	  </TouchableOpacity>
	);
  };

  export default ColorItem;