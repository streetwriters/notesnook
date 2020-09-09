import React from 'react';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';


export const NoteItemWrapper = ({item,index,isTrash = false, pinned = false }) => {
  const [state, dispatch] = useTracked();
  const {colors,currentEditingNote,selectionMode} = state;

  return  <SelectionWrapper
      index={index}
      pinned={pinned}
      currentEditingNote={
        currentEditingNote === item.id ? currentEditingNote : null
      }
      item={item}>
      <NoteItem
        colors={colors}
        pinned={pinned}
        customStyle={pinned? {
          width: selectionMode ? '90%' : '100%',
          marginHorizontal: 0,
          paddingTop: 10,
          paddingRight: 6,
          marginBottom: 5,
          marginTop: 15,
          borderBottomWidth: 0,
        } :{
          width: selectionMode ? '90%' : '100%',
          marginHorizontal: 0,
        }}
        currentEditingNote={
          currentEditingNote === item.id ? currentEditingNote : null
        }
        selectionMode={selectionMode}
        onLongPress={() => {
          if (!selectionMode) {
            dispatch({type: ACTIONS.SELECTION_MODE, enabled: true});
          }
          dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
        }}
        update={() => {
          dispatch({type: ACTIONS.NOTES});
        }}
        item={item}
        index={index}
        isTrash={isTrash}
      />
    </SelectionWrapper>
};
