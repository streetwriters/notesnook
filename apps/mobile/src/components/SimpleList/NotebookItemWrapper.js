import React from 'react';
import { NotebookItem } from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';

export const NotebookItemWrapper = ({item, index,isTrash = false, pinned = false}) => {
  const [state, dispatch] = useTracked();
  const {selectionMode,preventDefaultMargins} = state;
  let headerState = preventDefaultMargins? state.indHeaderState : state.headerState;
  let params = headerState.route.params? headerState.route.params : {};
  

  return (
    <SelectionWrapper pinned={pinned} index={index} item={item}>
      <NotebookItem
        hideMore={preventDefaultMargins}
        navigation={headerState.navigation}
        route={headerState.route}
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
        isMove={preventDefaultMargins}
        selectionMode={selectionMode}
        onLongPress={() => {
          if (!selectionMode) {
            dispatch({
              type: ACTIONS.SELECTION_MODE,
              enabled: !selectionMode,
            });
          }

          dispatch({
            type: ACTIONS.SELECTED_ITEMS,
            item: item,
          });
        }}
        noteToMove={params.note}
        item={item}
        index={index}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
};
