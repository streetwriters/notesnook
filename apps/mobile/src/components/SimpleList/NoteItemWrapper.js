import React, {useEffect, useMemo, useState} from 'react';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent, eSubscribeEvent, eUnSubscribeEvent, openVault} from '../../services/EventManager';
import {eShowMergeDialog, eOnLoadNote, eOnNoteEdited} from '../../utils/Events';
import {simpleDialogEvent} from '../DialogManager/recievers';
import {TEMPLATE_TRASH} from '../DialogManager/Templates';
import {openEditorAnimation} from '../../utils/Animations';
import {db} from "../../utils/DB";
import {DDS} from "../../services/DeviceDetection";



export const NoteItemWrapper = ({
                                    item,
                                    index,
                                    isTrash = false,
                                    pinned = false,
                                }) => {
    const [state, dispatch] = useTracked();
    const {colors, selectionMode} = state;
    const [note, setNote] = useState(item);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        setNote(item);
    },[item])

    const onNoteChange = (data) => {
        if (data.id !== note.id) {
            return;
        }
        if (editing !== true) {
            setEditing(true);
        }

        if (data.closed) {
            setEditing(false);
        }
        setNote(db.notes.note(data.id).data)
    }

    useEffect(() => {
        eSubscribeEvent(eOnNoteEdited + note.id, onNoteChange);
        return () => {
            eUnSubscribeEvent(eOnNoteEdited + note.id, onNoteChange);
        }
    }, [editing,item]);

    const style = useMemo(() => {
        return {width: selectionMode ? '90%' : '100%', marginHorizontal: 0};
    }, [selectionMode]);


    const onLongPress = () => {
        if (!selectionMode) {
            dispatch({type: Actions.SELECTION_MODE, enabled: true});
        }
        dispatch({type: Actions.SELECTED_ITEMS, item: item});
    };

    const onPress = async () => {
        if (item.conflicted) {
            eSendEvent(eShowMergeDialog, item);
            return;
        }
        if (selectionMode) {
            onLongPress();
            return;
        } else if (item.locked) {
            openVault(item, true, true, false, true, false);
            return;
        }
        if (isTrash) {
            simpleDialogEvent(TEMPLATE_TRASH(item.type));
        } else {
            eSendEvent(eOnLoadNote, item);
        }
        if (DDS.isPhone || DDS.isSmallTab) {
            openEditorAnimation();
        }
    };


    return (
        <SelectionWrapper
            index={index}
            pinned={pinned}
            onLongPress={onLongPress}
            onPress={onPress}
            currentEditingNote={editing}
            item={note}>
            <NoteItem
                colors={colors}
                customStyle={style}
                currentEditingNote={editing}
                selectionMode={selectionMode}
                item={note}
                isTrash={isTrash}
            />
        </SelectionWrapper>
    );
};
