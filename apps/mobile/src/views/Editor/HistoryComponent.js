import React, {useEffect, useState} from 'react';
import {ActionIcon} from '../../components/ActionIcon';
import {useTracked} from '../../provider';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import {post,} from './Functions';


const HistoryComponent = () => {
    const [state] = useTracked();
    const {colors} = state;
    const [historyState,setHistoryState] = useState({
        undo:0,
        redo:0
    });

    const onHistoryChange = (data) => {
        setHistoryState(data);
    }

    useEffect(() => {
        eSubscribeEvent('historyEvent',onHistoryChange);

        return () => {
            eUnSubscribeEvent('historyEvent',onHistoryChange);
        }
    },[])

    return (
        <>

            <ActionIcon
                name="undo"
                disabled={historyState.undo === 0}
                color={colors.heading}
                customStyle={{
                    marginLeft: 10,
                }}
                onPress={() => {
                    if (historyState.undo === 0) return;
                    post('undo');
                }}
            />
            <ActionIcon
                name="redo"
                disabled={historyState.redo=== 0}
                color={colors.heading}
                customStyle={{
                    marginLeft: 10,
                }}
                onPress={() => {
                    if (historyState.redo === 0) return;
                    post('redo');
                }}
            />

        </>
    );
};

export default HistoryComponent;
