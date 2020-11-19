import React, {useMemo} from 'react';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import NavigationService from '../../services/Navigation';

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
      onLongPress();
      return;
    }

    if (isTopic) {
      NavigationService.navigate('NotesPage', {
        ...item,
      });
      return;
    }

    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: item.title,
      },
    });
    dispatch({
      type: Actions.HEADER_STATE,
      state: false,
    });

    NavigationService.navigate('Notebook', {
      notebook: item,
      title: item.title,
      root: true,
    });
  };

  return (
    <SelectionWrapper
      onLongPress={onLongPress}
      pinned={pinned}
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
