import { groupArray } from '@streetwriters/notesnook-core/utils/grouping';
import React from 'react';
import NotesPage, { PLACEHOLDER_DATA } from '.';
import Navigation, { NavigationProps, NotesScreenParams } from '../../services/navigation';
import { db } from '../../utils/database';
import { TagType } from '../../utils/types';
import { getAlias, openEditor } from './common';

export const TaggedNotes = ({ navigation, route }: NavigationProps<'TaggedNotes'>) => {
  return (
    <NotesPage
      navigation={navigation}
      route={route}
      get={TaggedNotes.get}
      placeholderData={PLACEHOLDER_DATA}
      onPressFloatingButton={openEditor}
      canGoBack={route.params.canGoBack}
      focusControl={true}
    />
  );
};

TaggedNotes.get = (params: NotesScreenParams, grouped = true) => {
  let notes = db.notes?.tagged(params.item.id) || [];
  return grouped ? groupArray(notes, db.settings?.getGroupOptions('notes')) : notes;
};

TaggedNotes.navigate = (item: TagType, canGoBack: boolean) => {
  if (!item) return;
  //@ts-ignore TODO
  let alias = getAlias({ item: item });
  Navigation.navigate<'TaggedNotes'>(
    {
      name: 'TaggedNotes',
      alias: alias,
      title: item.title,
      id: item.id,
      type: 'tag'
    },
    {
      item: item,
      canGoBack,
      title: alias
    }
  );
};
