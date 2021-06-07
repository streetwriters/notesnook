import React from 'react';
import {NotebookItem} from '.';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import Navigation from '../../services/Navigation';
import {history} from '../../utils';
import SelectionWrapper from '../SelectionWrapper';

export const NotebookWrapper = React.memo(({item, index}) => {
  const [state, dispatch] = useTracked();
  const isTrash = item.type === 'trash';

  const onPress = () => {
    if (history.selectedItemsList.length > 0 && history.selectionMode) {
      dispatch({
        type: Actions.SELECTED_ITEMS,
        item: item,
      });
   
      return;
    }  else {
      history.selectedItemsList = [];
    }
    let routeName = item.type === "topic" ? 'NotesPage' : 'Notebook';
    
    let params = item.type === "topic"
      ? {...item, menu: false}
      : {
          menu: false,
          notebook: item,
          title: item.title,
        };
    let headerState = {
      heading: item.title,
      id: item.id,
      type: item.type,
    };
    Navigation.push(routeName, params, headerState);
  };
  return (
    <SelectionWrapper
      pinned={item.pinned}
      index={index}
      onPress={onPress}
      height={item.type === 'topic' ? 80 : 110}
      item={item}>
      <NotebookItem
        isTopic={item.type === 'topic'}
        item={item}
        index={index}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
});
