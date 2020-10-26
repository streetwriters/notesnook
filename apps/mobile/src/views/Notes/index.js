import React, {useCallback, useEffect, useState} from 'react';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {
  eOnLoadNote,
  eScrollEvent, eUpdateSearchState,
  refreshNotesPage,
} from '../../utils/Events';
import {openEditorAnimation} from '../../utils/Animations';
import {editing} from '../../utils';
import {COLORS_NOTE} from "../../utils/Colors";
import {db} from "../../utils/DB";
import {DDS} from "../../services/DeviceDetection";

export const Notes = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colorNotes} = state;
  const allNotes = state.notes;
  const [notes, setNotes] = useState([]);
  let params = route.params ? route.params : null;

  useEffect(() => {
    if (navigation.isFocused()) {
      if (!params) {
        params = {
          title: 'Notes',
        };
      }
      init();
    } else {
      setNotes([]);
      editing.actionAfterFirstSave = {
        type: null,
      };
    }
  }, [allNotes, colorNotes]);

  useEffect(() => {
    eSubscribeEvent(refreshNotesPage, init);
    return () => {
      eUnSubscribeEvent(refreshNotesPage, init);
      editing.actionAfterFirstSave = {
        type: null,
      };
    };
  }, []);

  const init = (data) => {
    console.log('refreshing notes!');
    params = route.params;
    if (data) {
      params = data;
    }
    let allNotes = [];
    eSendEvent(eScrollEvent, 0);
    if (params.type === 'tag') {
      allNotes = db.notes.tagged(params.tag.title);
    } else if (params.type === 'color') {
      allNotes = db.notes.colored(params.color.title);
    } else {
      allNotes = db.notebooks
        .notebook(params.notebookId)
        .topics.topic(params.title).all;
    }
    if (allNotes && allNotes.length > 0) {
      setNotes([...allNotes]);
    }
  };

  const onFocus = useCallback(() => {
    dispatch({
      type: Actions.HEADER_STATE,
      state: params.type === 'color',
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading:
          params.type === 'tag'
            ? '# ' + params.title
            : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
      },
    });
    init();
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: params.type === 'color' ? params.color.title : params.type,
    });
  }, []);

  const onBlur = useCallback(() => {
    setNotes([]);
    editing.actionAfterFirstSave = {
      type: null,
    };
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
      eSendEvent(eUpdateSearchState,{
          placeholder: `Search in ${
              params.type === 'tag' ? '#' + params.title : params.title
          }`,
          data: notes,
          noSearch: false,
          type: 'notes',
          color: params.type === 'color' ? params.title : null,
        })
    }
  }, [notes]);

  const _onPressBottomButton = useCallback(() => {
    if (params.type === 'tag') {
      editing.actionAfterFirstSave = {
        type: 'tag',
        id: params.tag.title,
      };
    } else if (params.type === 'color') {
      editing.actionAfterFirstSave = {
        type: 'color',
        id: params.color.id,
      };
    } else {
      editing.actionAfterFirstSave = {
        type: 'topic',
        id: params.title,
        notebook: params.notebookId,
      };
    }

    eSendEvent(eOnLoadNote, {type: 'new'});
    if (DDS.isPhone || DDS.isSmallTab) {
      openEditorAnimation();
    }
  }, [params.type]);

  return (
    <>
      <SimpleList
        data={notes}
        type="notes"
        refreshCallback={() => {
          init();
        }}
        focused={() => navigation.isFocused()}
        RenderItem={NoteItemWrapper}
        placeholder={<Placeholder type="notes" />}
        placeholderText={`Add some notes to this" ${
          params.type ? params.type : 'topic.'
        }`}
      />
      <ContainerBottomButton
        title="Create a new note"
        onPress={_onPressBottomButton}
        color={params.type == 'color' ? COLORS_NOTE[params.title] : null}
      />
    </>
  );
};

export default Notes;
