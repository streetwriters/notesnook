import React, {useState} from 'react';
import {ActionIcon} from '../../components/ActionIcon';
import {useTracked} from '../../provider';
import {post,} from './Functions';


const HistoryComponent = () => {
    const [state] = useTracked();
    const {colors} = state;
    const [historyState,setHistoryState] = useState({
        undo:0,
        redo:0
    });

    return (
        <>

            <ActionIcon
                name="undo-variant"
                color={colors.heading}
                customStyle={{
                    marginLeft: 10,
                }}
                onPress={() => {
                    post('undo');
                }}
            />
            <ActionIcon
                name="redo-variant"
                color={colors.heading}
                customStyle={{
                    marginLeft: 10,
                }}
                onPress={() => {
                    post('redo');
                }}
            />

        </>
    );
};

export default HistoryComponent;
