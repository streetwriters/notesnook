import React, {useCallback, useEffect} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent} from '../../services/EventManager';
import {eOnLoadNote, eScrollEvent} from '../../utils/Events';
import {openEditorAnimation} from '../../utils/Animations';
import {DDS} from "../../services/DeviceDetection";

export const Home = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {notes} = state;

  const onFocus = useCallback(() => {
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'home',
    });
    dispatch({
      type: Actions.HEADER_STATE,
      state: {
        type: 'notes',
        menu: true,
        canGoBack: false,
        color: null,
      },
    });
    dispatch({
      type: Actions.HEADER_VERTICAL_MENU,
      state: true,
    });
    dispatch({
      type: Actions.SEARCH_STATE,
      state: {
        placeholder: 'Search all notes',
        data: notes,
        noSearch: false,
        type: 'notes',
        color: null,
      },
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: 'Home',
      },
    });
    eSendEvent(eScrollEvent, 0);
    dispatch({type: Actions.COLORS});
    dispatch({type: Actions.NOTES});
  }, []);

  const onBlur = useCallback(() => {
    console.log(navigation.isFocused());
    dispatch({
      type: Actions.HEADER_VERTICAL_MENU,
      state: false,
    });
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
      dispatch({
        type: Actions.SEARCH_STATE,
        state: {
          placeholder: 'Search all notes',
          data: notes,
          noSearch: false,
          type: 'notes',
          color: null,
        },
      });
    }
  }, [notes]);

  const _onPressBottomButton = async () => {
    eSendEvent(eOnLoadNote, {type: 'new'});

    if (DDS.isPhone || DDS.isSmallTab) {
      openEditorAnimation();
    }
  };
  useEffect(() => {
    console.log('render home');
  });

  return (
    <>
      <SimpleList
        data={notes}
        type="notes"
        isHome={true}
        pinned={true}
        focused={() => navigation.isFocused()}
        RenderItem={NoteItemWrapper}
        placeholder={<Placeholder type="notes" />}
        placeholderText={`Notes you write appear here`}
      />

      <ContainerBottomButton
        title="Create a new note"
        onPress={_onPressBottomButton}
      />
    </>
  );
};

export default Home;
