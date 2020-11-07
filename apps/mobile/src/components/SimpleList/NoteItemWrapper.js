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
        if (data.id !== note.id || data.closed) {
            if (editing) {
                setEditing(false);
            }
            return;
        }
        if (!editing && !data.noEdit) {
            setEditing(true);
        }
        let newNote = db.notes.note(data.id).data;

        if (!data.noEdit && newNote.title === note.title && newNote.headline === note.headline) {
            return;
        }
        setNote(newNote);
    }

    useEffect(() => {
        eSubscribeEvent(eOnNoteEdited , onNoteChange);
        return () => {
            eUnSubscribeEvent(eOnNoteEdited , onNoteChange);
        }
    }, [editing,note]);

    const style = useMemo(() => {
        return {width: selectionMode ? '90%' : '100%', marginHorizontal: 0};
    }, [selectionMode]);


    const onLongPress = () => {
        if (!selectionMode) {
            dispatch({type: Actions.SELECTION_MODE, enabled: true});
        }
        dispatch({type: Actions.SELECTED_ITEMS, item: note});
    };

    const onPress = async (event) => {
        if (note.conflicted) {
            eSendEvent(eShowMergeDialog, note);
            return;
        }
        if (selectionMode) {
            onLongPress();
            return;
        } else if (note.locked) {
            openVault(item, true, true, false, true, false);
            return;
        }
        if (isTrash) {
            simpleDialogEvent(TEMPLATE_TRASH(note.type));
        } else {
            eSendEvent(eOnLoadNote, note);
        }
        if (DDS.isPhone || DDS.isSmallTab) {
            openEditorAnimation(event.nativeEvent);
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
}
