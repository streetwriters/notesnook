import React, {useMemo} from 'react';
import {notesnook} from '../../../e2e/test.ids';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import Navigation from '../../services/Navigation';
import {rootNavigatorRef} from '../../utils/Refs';

export const NotebookItemWrapper = ({
  item,
  index,
  isTrash = false,
  pinned = false,
  isTopic,
}) => {
  const [state, dispatch] = useTracked();
  const {selectionMode, preventDefaultMargins} = state;

  const style = useMemo(() => {
    return {width: selectionMode ? '90%' : '100%', marginHorizontal: 0};
  }, [selectionMode]);

  const onLongPress = () => {
    if (item.title === 'General') return;
    if (!selectionMode) {
      dispatch({
        type: Actions.SELECTION_MODE,
        enabled: !selectionMode,
      });
    }

    dispatch({
      type: Actions.SELECTED_ITEMS,
      item: item,
    });
  };

  const onPress = () => {
    if (selectionMode) {
      console.log(item.title);
      onLongPress();
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
      onLongPress={onLongPress}
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
        hideMore={preventDefaultMargins}
        isTopic={isTopic}
        customStyle={style}
        item={item}
        index={index}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
};
