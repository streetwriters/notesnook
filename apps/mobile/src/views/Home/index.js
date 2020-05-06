import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import Container from '../../components/Container';
import { NotesPlaceHolder } from '../../components/ListPlaceholders';
import NoteItem from '../../components/NoteItem';
import SelectionHeader from '../../components/SelectionHeader';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';
import { eSendEvent } from '../../services/eventManager';
import { eOnLoadNote, eScrollEvent } from '../../services/events';
import { openEditorAnimation } from '../../utils/animations';
import { sideMenuRef } from '../../utils/refs';
import { DDS } from '../../utils/utils';
let count = 0;

export const Home = ({navigation}) => {
  const [state, dispatch] = useTracked();

  const {
    colors,
    selectionMode,
    currentEditingNote,
    loading,
    notes,
    pinned,
  } = state;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'home',
      });
      eSendEvent(eScrollEvent, 0);
      dispatch({type: ACTIONS.COLORS});
      dispatch({type: ACTIONS.NOTES});
      dispatch({type: ACTIONS.PINNED});
    }
  }, [isFocused]);
  const _renderItem = ({item, index}) => (
    <SelectionWrapper
      index={index}
      currentEditingNote={
        currentEditingNote === item.id ? currentEditingNote : null
      }
      item={item}>
      <NoteItem
        colors={colors}
        customStyle={{
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
      />
    </SelectionWrapper>
  );

  return (
    <Container
      bottomButtonText="Create a new note"
      heading="Home"
      customIcon="menu"
      verticalMenu
      type="notes"
      menu
      placeholder="Search all notes"
      canGoBack={false}
      bottomButtonOnPress={() => {
        if (DDS.isTab) {
          eSendEvent(eOnLoadNote, {type: 'new'});
        } else {
          eSendEvent(eOnLoadNote, {type: 'new'});
          openEditorAnimation();
        }
      }}
      data={notes ? notes : []}>
      <SelectionHeader />

      <SimpleList
        data={notes}
        type="notes"
        isHome={true}
        pinned={pinned.notes}
        focused={isFocused}
        renderItem={_renderItem}
        placeholder={<NotesPlaceHolder colors={colors} />}
        placeholderText={`Notes you write appear here`}
      />
    </Container>
  );
};



export default Home;
