import React, {useEffect, useState} from 'react';
import {useIsFocused} from 'react-navigation-hooks';
import Container from '../../components/Container';
import SelectionHeader from '../../components/SelectionHeader';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {DDS} from '../../utils/utils';
import {eScrollEvent, eOnLoadNote} from '../../services/events';
import {openEditorAnimation} from '../../utils/animations';
import {sideMenuRef} from '../../utils/refs';
import SimpleList from '../../components/SimpleList';
import {NotesPlaceHolder} from '../../components/ListPlaceholders';
import SelectionWrapper from '../../components/SelectionWrapper';
import NoteItem from '../../components/NoteItem';
let count = 0;

export const Home = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const [refreshing, setRefreshing] = useState(false);
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
    }
  }, [isFocused]);

  const _onRefresh = async () => {
    setRefreshing(true);
    try {
      await db.sync();
      setRefreshing(false);
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      setRefreshing(false);
      ToastEvent.show(e.message, 'error');
    }
    dispatch({type: ACTIONS.NOTES});
    dispatch({type: ACTIONS.PINNED});
    let user = await db.user.get();
    dispatch({type: ACTIONS.USER, user: user});
  };

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
          sideMenuRef.current?.openMenu(false);
          sideMenuRef.current?.setGestureEnabled(false);
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
        pinned={pinned}
        refreshing={refreshing}
        focused={isFocused}
        onRefresh={_onRefresh}
        renderItem={_renderItem}
        placeholder={<NotesPlaceHolder colors={colors} />}
        placeholderText={`Notes you write appear here`}
      />
    </Container>
  );
};

Home.navigationOptions = {
  header: null,
  headerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 0,
  },
};

export default Home;
