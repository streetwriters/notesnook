import React, { useCallback, useEffect } from 'react';
import { ContainerHeader } from '../../components/container/containerheader';
import { Header } from '../../components/header';
import { Placeholder } from '../../components/ui/svg';
import SelectionHeader from '../../components/selection-header';
import List from '../../components/list';
import { useTagStore } from '../../provider/stores';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { InteractionManager } from '../../utils';

export const Tags = ({ navigation }) => {
  const tags = useTagStore(state => state.tags);
  const setTags = useTagStore(state => state.setTags);
  let ranAfterInteractions = false;

  const runAfterInteractions = () => {
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('Tags', () => {
        setTags();
      });
    });
    updateSearch();
    ranAfterInteractions = false;
  };

  const onFocus = useCallback(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
    Navigation.setHeaderState(
      'Tags',
      {
        menu: true
      },
      {
        heading: 'Tags',
        id: 'tags_navigation'
      }
    );
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      ranAfterInteractions = false;
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [tags]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in tags',
      data: tags,
      type: 'tags',
      title: 'Tags'
    });
  };

  return (
    <>
      <SelectionHeader screen="Tags" />
      <ContainerHeader>
        <Header title="Tags" isBack={false} screen="Tags" />
      </ContainerHeader>
      <List
        listData={tags}
        type="tags"
        headerProps={{
          heading: 'Tags'
        }}
        screen="Tags"
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: 'Your tags',
          paragraph: 'You have not created any tags for your notes yet.',
          button: null,
          loading: 'Loading your tags.'
        }}
        placeholderText="Tags added to notes appear here"
      />
    </>
  );
};

export default Tags;
