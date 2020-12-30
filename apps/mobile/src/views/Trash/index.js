import React, {useCallback, useEffect} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {simpleDialogEvent} from '../../components/DialogManager/recievers';
import {TEMPLATE_EMPTY_TRASH} from '../../components/DialogManager/Templates';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {eScrollEvent} from '../../utils/Events';

export const Trash = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const trash = state.trash;
  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name: 'Trash', type: 'in'});
    if (DDS.isLargeTablet()) {
      dispatch({
        type: Actions.CONTAINER_BOTTOM_BUTTON,
        state: {
          onPress: null,
        },
      });
    }
    updateSearch();
    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState(
      'trash',
      {
        menu: true,
      },
      {
        heading: 'Trash',
        id: 'trash_navigation',
      },
    );
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      pageIsLoaded = false;

      eSendEvent(eScrollEvent, {name: 'Trash', type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [trash]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in trash',
      data: trash,
      type: 'trash',
    });
  };

  const _onPressBottomButton = () => simpleDialogEvent(TEMPLATE_EMPTY_TRASH);

  return (
    <>
      <SimpleList
        data={trash}
        type="trash"
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: 'Trash',
          paragraph:
            'Items in the trash will be permanently deleted after 7 days.',
          button: null,
        }}
        headerProps={{
          heading: 'Trash',
        }}
        placeholder={<Placeholder type="trash" />}
        placeholderText="Deleted notes & notebooks appear here."
      />

      {trash && trash.length !== 0 && (
        <ContainerBottomButton
          title="Clear all trash"
          onPress={_onPressBottomButton}
          shouldShow={true}
        />
      )}
    </>
  );
};

export default Trash;
