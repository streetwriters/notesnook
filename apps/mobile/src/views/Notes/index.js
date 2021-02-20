import React, {useCallback, useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {editing, InteractionManager} from '../../utils';
import {COLORS_NOTE} from '../../utils/Colors';
import {db} from '../../utils/DB';
import {
  eOnLoadNote,
  eOpenAddTopicDialog,
  eScrollEvent,
  refreshNotesPage,
} from '../../utils/Events';
import {tabBarRef} from '../../utils/Refs';

export const Notes = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {loading} = state;
  const [localLoad, setLocalLoad] = useState(true);
  const [notes, setNotes] = useState([]);
  let params = route.params ? route.params : null;
  let pageIsLoaded = false;
  let ranAfterInteractions = false;

  const runAfterInteractions = (time = 300) => {
    InteractionManager.runAfterInteractions(() => {
      if (localLoad) {
        setLocalLoad(false);
      }
      Navigation.routeNeedsUpdate('NotesPage', () => {
        init();
      });

      if (params.menu) {
        navigation.setOptions({
          animationEnabled: false,
          gestureEnabled: false,
        });
      } else {
        navigation.setOptions({
          animationEnabled: true,
          gestureEnabled: Platform.OS === 'ios',
        });
      }

      let _notes = [];
      if (params.type === 'tag') {
        _notes = db.notes.tagged(params.tag?.id);
      } else if (params.type === 'color') {
        _notes = db.notes.colored(params.color?.id);
      } else {
        _notes = db.notebooks
          .notebook(params.notebookId)
          .topics.topic(params.id).all;
      }

      if (
        (params.type === 'tag' || params.type === 'color') &&
        (!_notes || _notes.length === 0)
      ) {
        Navigation.goBack();
      }

      setNotes([..._notes]);
      updateSearch();
      dispatch({
        type: Actions.CONTAINER_BOTTOM_BUTTON,
        state: {
          onPress: _onPressBottomButton,
          color: params.type == 'color' ? COLORS_NOTE[params.title] : null,
        },
      });
      ranAfterInteractions = false;
    }, time);
  };

  useEffect(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
    eSubscribeEvent(refreshNotesPage, init);
    return () => {
      ranAfterInteractions = false;
      eUnSubscribeEvent(refreshNotesPage, init);
      editing.actionAfterFirstSave = {
        type: null,
      };
    };
  }, []);

  const setActionAfterFirstSave = () => {
    if (params.type === 'tag') {
      editing.actionAfterFirstSave = {
        type: 'tag',
        id: params.tag.id,
      };
    } else if (params.type === 'color') {
      editing.actionAfterFirstSave = {
        type: 'color',
        id: params.color.id,
      };
    } else {
      editing.actionAfterFirstSave = {
        type: 'topic',
        id: params.id,
        notebook: params.notebookId,
      };
    }
  };

  const init = (data) => {
    if (data) {
      setLocalLoad(true);
      params = data;
      setActionAfterFirstSave();
    }
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions(data ? 500 : 1);
    }

    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }

    Navigation.setHeaderState('NotesPage', params, {
      heading:
        params.type === 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
      id:
        params.type === 'tag'
          ? params.tag.id
          : params.type === 'topic'
          ? params.id
          : params.type === 'color'
          ? params.color.id
          : null,
      type: params.type,
    });
  };

  const onFocus = () => {
    eSendEvent(eScrollEvent, {
      name:
        params.type === 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
      type: 'in',
    });
    init();
  };

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
      eSendEvent(eScrollEvent, {
        name:
          params.type === 'tag'
            ? '#' + params.title
            : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
        type: 'hide',
      });
      editing.actionAfterFirstSave = {
        type: null,
      };
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [notes]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: `Search in ${
        params.type === 'tag' ? '#' + params.title : params.title
      }`,
      data: notes,
      noSearch: false,
      type: 'notes',
      color: params.type === 'color' ? params.title : null,
      title:
        params.type === 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
    });
  };

  const _onPressBottomButton = () => {
    setActionAfterFirstSave();

    if (DDS.isPhone || DDS.isSmallTab) {
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  };

  return (
    <>
      <SimpleList
        listData={notes.reverse()}
        type="notes"
        refreshCallback={() => {
          init();
        }}
        headerProps={{
          heading:
            params.type === 'tag'
              ? '#' + params.title
              : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
          color: params.type === 'color' ? params.title.toLowerCase() : null,
          paragraph:
            route.params.type === 'topic' && route.params.title !== 'General'
              ? 'Edit topic'
              : null,
          onPress: () => {
            console.log(route.params);
            if (route.params.type !== 'topic') return;

            eSendEvent(eOpenAddTopicDialog, {
              notebookId: route.params.notebookId,
              toEdit: route.params,
            });
          },
          icon: 'pencil',
        }}
        loading={loading || localLoad}
        focused={() => navigation.isFocused()}
        placeholderText={`Add some notes to this" ${
          params.type ? params.type : 'topic.'
        }`}
        placeholderData={{
          heading: 'Your notes',
          paragraph: 'You have not added any notes yet.',
          button: 'Add your first Note',
          action: _onPressBottomButton,
          loading: 'Loading your notes.',
        }}
      />
      <ContainerBottomButton
        title="Create a new note"
        onPress={_onPressBottomButton}
        color={params.type == 'color' ? params.title : null}
      />
    </>
  );
};

export default Notes;
