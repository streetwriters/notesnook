import React from 'react';
import {
	View
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useTracked } from '../../provider';
import {
	eSendEvent
} from '../../services/EventManager';
import { eOpenJumpToDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import { HeaderMenu } from '../Header/HeaderMenu';
import Heading from '../Typography/Heading';

export const SectionHeader = ({
	item,
	index,
	headerProps,
	jumpToDialog,
	sortMenuButton,
  }) => {
	const [state] = useTracked();
	const {colors} = state;
  
	return (
	  <View
		style={{
		  flexDirection: 'row',
		  alignItems: 'center',
		  width: '100%',
		  justifyContent: 'space-between',
		  paddingHorizontal: 12,
		  height: 30,
		  backgroundColor:
			index === 1
			  ? headerProps.color
				? colors[headerProps.color]
				: colors.shade
			  : colors.nav,
		  marginTop: index === 1 ? 0 : 5,
		}}>
		<TouchableWithoutFeedback
		  onPress={() => {
			if (jumpToDialog) {
			  eSendEvent(eOpenJumpToDialog);
			}
		  }}
		  hitSlop={{top: 10, left: 10, right: 30, bottom: 15}}
		  style={{
			height: '100%',
			justifyContent: 'center',
		  }}>
		  <Heading
			color={colors.accent}
			size={SIZE.sm}
			style={{
			  minWidth: 60,
			  alignSelf: 'center',
			  textAlignVertical: 'center',
			}}>
			{!item.title || item.title === '' ? 'Pinned' : item.title}
		  </Heading>
		</TouchableWithoutFeedback>
		{index === 1 && sortMenuButton ? <HeaderMenu /> : null}
	  </View>
	);
  };