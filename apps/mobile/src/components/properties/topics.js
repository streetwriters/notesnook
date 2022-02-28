import React from 'react';
import { View } from 'react-native';
import { eSendEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { refreshNotesPage } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { Button } from '../ui/button';

export const Topics = ({ item, close }) => {
  const open = topic => {
    close();

    let routeName = 'NotesPage';
    let params = { ...topic, menu: false, get: 'topics' };
    let headerState = {
      heading: topic.title,
      id: topic.id,
      type: topic.type
    };
    eSendEvent(refreshNotesPage, params);
    Navigation.navigate(routeName, params, headerState);
  };

  const renderItem = topic => (
    <Button
      key={topic.id}
      title={topic.title}
      type="grayBg"
      // buttonType={{
      //   text: colors.accent
      // }}
      height={30}
      onPress={() => open(topic)}
      icon="bookmark-outline"
      fontSize={SIZE.xs + 1}
      style={{
        marginRight: 5,
        paddingHorizontal: 8,
        borderRadius: 100,
        marginVertical: 5
      }}
    />
  );

  return item && item.type === 'notebook' && item.topics && item.topics.length > 0 ? (
    <View
      style={{
        flexDirection: 'row',
        marginTop: 5,
        width: '100%',
        flexWrap: 'wrap'
      }}
    >
      {item.topics
        .sort((a, b) => a.dateEdited - b.dateEdited)
        .slice(0, 6)
        .map(renderItem)}
    </View>
  ) : null;
};
