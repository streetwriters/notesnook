import React from 'react';
import {useTracked} from '../../provider';
import {SIZE, WEIGHT} from "../../utils/SizeUtils";
import {Text, TouchableOpacity} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {eSendEvent} from "../../services/EventManager";
import {eOpenSortDialog} from "../../utils/Events";



export const HeaderMenu = () => {
    const [state,] = useTracked();
    const {colors,settings} = state;


    return <TouchableOpacity
        onPress={() => {
            eSendEvent(eOpenSortDialog);
        }}
        activeOpacity={1}
        style={{
            flexDirection: 'row',
            alignItems: 'center',
        }}>
        <Text
            style={{
                fontSize: SIZE.xs + 1,
                fontFamily: WEIGHT.regular,
                color: colors.icon,
                marginRight: 5
            }}>
            {settings.sort.slice(0,1).toUpperCase() + settings.sort.slice(1,settings.sort.length)}
        </Text>
        <Icon color={colors.icon}
              name={settings.sortOrder === "asc" ? "sort-ascending" : "sort-descending"}
              size={SIZE.md}/>
    </TouchableOpacity>
};
