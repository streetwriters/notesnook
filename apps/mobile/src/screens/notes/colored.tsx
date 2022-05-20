import { groupArray } from 'notes-core/utils/grouping';
import React from 'react';
import NotesPage, { PLACEHOLDER_DATA } from '.';
import Navigation, { NavigationProps, NotesScreenParams } from '../../services/navigation';
import { db } from '../../utils/database';
import { ColorType, TagType } from '../../utils/types';
import { getAlias, openEditor, toCamelCase } from './common';

export const ColoredNotes = ({ navigation, route }: NavigationProps<'ColoredNotes'>) => {
  return (
    <NotesPage
      navigation={navigation}
      route={route}
      get={ColoredNotes.get}
      placeholderData={PLACEHOLDER_DATA}
      onPressFloatingButton={openEditor}
      canGoBack={route.params.canGoBack}
      focusControl={true}
    />
  );
};

ColoredNotes.get = (params: NotesScreenParams, grouped = true) => {
  let notes = db.notes?.colored(params.item.id) || [];
  return grouped ? groupArray(notes, db.settings?.getGroupOptions('notes')) : notes;
};

ColoredNotes.navigate = (item: ColorType, canGoBack: boolean) => {
  if (!item) return;
  //@ts-ignore TODO
  let alias = getAlias({ item: item });
  Navigation.navigate<'ColoredNotes'>(
    {
      name: 'ColoredNotes',
      alias: toCamelCase(alias),
      title: item.title,
      id: item.id,
      type: 'color'
    },
    {
      item: item,
      canGoBack,
      title: toCamelCase(alias)
    }
  );
};
