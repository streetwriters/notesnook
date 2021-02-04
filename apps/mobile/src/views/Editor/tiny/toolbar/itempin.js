import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../../services/EventManager';
import { useTracked } from '../../../../provider';


const ToolbarItemPin = ({format, color}) => {
	const [state] = useTracked();
	const {colors} = state;
	const [visible, setVisible] = useState(false);
  
	useEffect(() => {
	  eSubscribeEvent('showTooltip', show);
	  return () => {
		eUnSubscribeEvent('showTooltip', show);
	  };
	}, []);
  
	const show = (data) => {
	  if (data?.title === format) {
		setVisible(true);
	  } else {
		setVisible(false);
	  }
	};
  
	return (
	  visible && (
		<View
		  style={{
			width: 10,
			height: 10,
			backgroundColor: color || colors.accent,
			borderRadius: 100,
			position: 'absolute',
			top: 0,
			top: -10,
		  }}
		/>
	  )
	);
  };

  export default ToolbarItemPin