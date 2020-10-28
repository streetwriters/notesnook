import React from 'react';
import {useTracked} from '../../provider';
import {SIZE} from "../../utils/SizeUtils";
import {DDS} from "../../services/DeviceDetection";
import {ActionIcon} from "../ActionIcon";
import NavigationService from "../../services/Navigation";

export const HeaderLeftMenu = () => {
    const [state,] = useTracked();
    const {colors, headerMenuState} = state;

    const onLeftButtonPress = () => {
        if (headerMenuState) {
            NavigationService.openDrawer();
            return;
        }
        NavigationService.goBack();
    };

    return (
        <>
            {!DDS.isTab ? (
                <ActionIcon
                    testID="left_menu_button"
                    customStyle={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 40,
                        width: 40,
                        borderRadius: 100,
                        marginLeft: -5,
                        marginRight: 25,
                    }}
                    onPress={onLeftButtonPress}
                    name={!headerMenuState ? 'arrow-left' : 'menu'}
                    size={SIZE.xxxl}
                    color={colors.pri}
                    iconStyle={{
                        marginLeft: !headerMenuState ? -5 : 0,
                    }}
                />
            ) : undefined}
        </>
    );
};
