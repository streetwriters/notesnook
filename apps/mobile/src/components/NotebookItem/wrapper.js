import React, {useMemo} from 'react';
import {notesnook} from '../../../e2e/test.ids';
import {NotebookItem} from '.';
import SelectionWrapper from '../SelectionWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import Navigation from '../../services/Navigation';
import {rootNavigatorRef} from '../../utils/Refs';
import { history } from '../../utils';

export const NotebookWrapper = ({
  item,
  index,
  isTrash = false,
  pinned = false,
  isTopic,
}) => {
  const [state, dispatch] = useTracked();


  const onPress = () => {
    if (history.selectedItemsList.length > 0) {
      dispatch({
        type: Actions.SELECTED_ITEMS,
        item: item,
      });
      return;
    }
    let routeName = isTopic ? 'NotesPage' : 'Notebook';
    let params = isTopic
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
      pinned={pinned}
      testID={
        isTopic
          ? notesnook.ids.topic.get(index)
          : notesnook.ids.notebook.get(index)
      }
      index={index}
      onPress={onPress}
      item={item}>
      <NotebookItem
        isTopic={isTopic}
        item={item}
        index={index}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
};
