import React from 'react';
import { FlatList } from 'react-native';
import { useTracked } from '../../provider';
import { NotebookItemWrapper } from './NotebookItemWrapper';
import { NoteItemWrapper } from './NoteItemWrapper';

export const PinnedItemList = ({type}) => {
  const [state, dispatch] = useTracked();
  const {pinned} = state;

  return pinned? (
    <>
      <FlatList
        data={type === 'notebooks' ? pinned.notebooks : pinned.notes}
        keyExtractor={(item, index) => item.id.toString()}
        renderItem={({item, index}) =>
          item.type === 'notebook' ? (
            <NotebookItemWrapper pinned={true} item={item} index={index} />
          ) : (
            <NoteItemWrapper pinned={true} item={item} index={index} />
          )
        }
      />
    </>
  ) : null;
};
