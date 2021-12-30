import React from 'react';
import {ScrollView, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/database';
import {eOnNewTopicAdded, refreshNotesPage} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';

export default function Notebooks({note, close}) {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  function getNotebooks(item) {
    if (!item.notebooks || item.notebooks.length < 1) return [];
    let notebooks = [];
    for (let notebook of item.notebooks) {
      let item_notebook = db.notebooks.notebook(notebook.id);
      console.log(notebook);
      if (item_notebook) {
        let data = {
          id: notebook.id,
          title: item_notebook.title,
          topics: notebook.topics
            .map(item => {
              let topic = item_notebook.topics.topic(item)?._topic;
              if (!topic) return null;
              return {
                id: topic.id,
                title: topic.title
              };
            })
            .filter(i => i !== null)
        };
        notebooks.push(data);
      }
    }
    return notebooks;
  }

  const navigateNotebook = id => {
    let routeName = 'Notebook';
    let item = db.notebooks.notebook(id).data;
    let params = {
      menu: false,
      notebook: item,
      title: item.title
    };
    let headerState = {
      heading: item.title,
      id: item.id,
      type: item.type
    };
    eSendEvent(eOnNewTopicAdded, params);
    Navigation.navigate(routeName, params, headerState);
  };

  const navigateTopic = (id, notebookId) => {
    let routeName = 'NotesPage';
    let item = db.notebooks.notebook(notebookId).topics.topic(id)._topic;

    let params = {...item, menu: false};
    let headerState = {
      heading: item.title,
      id: item.id,
      type: item.type
    };
    eSendEvent(refreshNotesPage, params);
    Navigation.navigate(routeName, params, headerState);
  };

  return !note.notebooks || note.notebooks.length === 0 ? null : (
    <View
      style={{
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: colors.nav
      }}>
      {getNotebooks(note).map(item => (
        <PressableButton
          onPress={() => {
            navigateNotebook(item.id);
            close();
          }}
          customStyle={{
            justifyContent: 'flex-start',
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            flexShrink: 1,
            flexGrow: 1,
            marginTop: 5,
            paddingVertical: 6
          }}>
          <Icon
            name="book-outline"
            color={colors.accent}
            size={SIZE.sm + 1}
            style={{
              marginRight: 5
            }}
          />
          <Heading
            numberOfLines={1}
            style={{
              maxWidth: '50%'
            }}
            size={SIZE.sm}>
            {item.title}
          </Heading>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={{
              flexDirection: 'row',
              marginLeft: 8,
              borderLeftColor: colors.nav,
              borderLeftWidth: 1,
              paddingLeft: 8
            }}>
            {item.topics.map(topic => (
              <Button
                onPress={() => {
                  navigateTopic(topic.id, item.id);
                  close();
                }}
                title={topic.title}
                type="grayBg"
                height={22}
                fontSize={SIZE.xs + 1}
                icon="bookmark-outline"
                style={{
                  marginRight: 5,
                  borderRadius: 100,
                  paddingHorizontal: 8
                }}
              />
            ))}
            <View style={{width: 10}} />
          </ScrollView>
        </PressableButton>
      ))}
    </View>
  );
}
