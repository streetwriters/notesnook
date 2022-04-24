import React, { RefObject, useState } from 'react';
import { Platform, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { FlatList } from 'react-native-gesture-handler';
import { useThemeStore } from '../../../stores/use-theme-store';
import { eSendEvent, presentSheet, ToastEvent } from '../../../services/event-manager';
import Navigation from '../../../services/navigation';
import { db } from '../../../utils/database';
import { eCloseProgressDialog } from '../../../utils/events';
import { SIZE } from '../../../utils/size';
import { IconButton } from '../../ui/icon-button';
import { Button } from '../../ui/button';
import { Dialog } from '../../dialog';
import DialogHeader from '../../dialog/dialog-header';
import { presentDialog } from '../../dialog/functions';
import { PressableButton } from '../../ui/pressable';
import Seperator from '../../ui/seperator';
import Heading from '../../ui/typography/heading';
import Paragraph from '../../ui/typography/paragraph';
import SearchService from '../../../services/search';

export const MoveNotes = ({
  notebook,
  selectedTopic,
  fwdRef
}: {
  notebook: any;
  selectedTopic?: any;
  fwdRef: RefObject<ActionSheet>;
}) => {
  const colors = useThemeStore(state => state.colors);
  const [currentNotebook, setCurrentNotebook] = useState(notebook);

  let notes = db.notes?.all;

  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [topic, setTopic] = useState(selectedTopic);
  //@ts-ignore
  notes = notes.filter(note => topic?.notes.indexOf(note.id) === -1);

  const select = (id: string) => {
    let index = selectedNoteIds.indexOf(id);
    if (index > -1) {
      setSelectedNoteIds(selectedNoteIds => {
        let next = [...selectedNoteIds];
        next.splice(index, 1);
        return next;
      });
    } else {
      setSelectedNoteIds(selectedNoteIds => {
        let next = [...selectedNoteIds];
        next.push(id);
        return next;
      });
    }
  };

  const openAddTopicDialog = () => {
    presentDialog({
      //@ts-ignore
      context: 'local',
      input: true,
      inputPlaceholder: 'Enter title',
      title: 'New topic',
      paragraph: 'Add a new topic in ' + currentNotebook.title,
      positiveText: 'Add',
      positivePress: value => {
        return addNewTopic(value);
      }
    });
  };

  const addNewTopic = async (value: string) => {
    if (!value || value.trim().length === 0) {
      //@ts-ignore
      ToastEvent.show({
        heading: 'Topic title is required',
        type: 'error',
        context: 'local'
      });
      return false;
    }
    await db.notebooks?.notebook(currentNotebook.id).topics.add(value);
    setCurrentNotebook(db.notebooks?.notebook(currentNotebook.id).data);

    Navigation.queueRoutesForUpdate(
      'Notes',
      'Favorites',
      'ColoredNotes',
      'TaggedNotes',
      'TopicNotes',
      'Notebook',
      'Notebooks'
    );
    return true;
  };

  const renderItem = ({ item, index }) => {
    return (
      <PressableButton
        testID="listitem.select"
        onPress={() => {
          if (item.type == 'topic') {
            setTopic(topic ? null : item);
          } else {
            select(item.id);
          }
        }}
        type={'transparent'}
        customStyle={{
          paddingVertical: 12,
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          flexDirection: 'row'
        }}
      >
        <View
          style={{
            flexShrink: 1
          }}
        >
          <Paragraph numberOfLines={1} color={item?.id === topic?.id ? colors.accent : colors.pri}>
            {item.title}
          </Paragraph>
          {item.type == 'note' && item.headline ? (
            <Paragraph numberOfLines={1} color={colors.icon} size={SIZE.xs + 1}>
              {item.headline}
            </Paragraph>
          ) : null}
        </View>

        {item.type === 'topic' ? (
          <Paragraph
            style={{
              fontSize: SIZE.xs
            }}
            color={colors.icon}
          >
            {item.notes.length} Notes
          </Paragraph>
        ) : null}

        {selectedNoteIds.indexOf(item.id) > -1 ? (
          <IconButton
            customStyle={{
              width: null,
              height: null,
              backgroundColor: 'transparent'
            }}
            name="check"
            type="grayAccent"
            color={colors.accent}
          />
        ) : null}
      </PressableButton>
    );
  };

  /**
   *
   */
  return (
    <View
      style={{
        paddingHorizontal: 12,
        maxHeight: Platform.OS === 'ios' ? '96%' : '97%'
      }}
    >
      <Dialog context="local" />
      {topic ? (
        <PressableButton
          onPress={() => {
            setTopic(null);
          }}
          customStyle={{
            paddingVertical: 12,
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            marginBottom: 10,
            alignItems: 'flex-start'
          }}
          type="grayBg"
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <Heading size={SIZE.md}>Adding notes to {currentNotebook.title}</Heading>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              marginTop: 5
            }}
          >
            <Paragraph color={colors.accent}>in {topic.title}</Paragraph>

            <Paragraph
              style={{
                fontSize: SIZE.xs
              }}
            >
              Tap to change
            </Paragraph>
          </View>
        </PressableButton>
      ) : (
        <>
          <DialogHeader
            title={`Add notes to ${currentNotebook.title}`}
            paragraph={
              topic
                ? `Select notes you would like to move to ${topic.title}.`
                : 'Select the topic in which you would like to move notes.'
            }
          />
          <Seperator />
        </>
      )}

      <FlatList
        nestedScrollEnabled
        onMomentumScrollEnd={() => {
          fwdRef.current?.handleChildScrollEnd();
        }}
        ListEmptyComponent={
          <View
            style={{
              minHeight: 100,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Paragraph color={colors.icon}>
              {topic ? 'No notes to show' : 'No topics in this notebook'}
            </Paragraph>

            {!topic && (
              <Button
                style={{
                  marginTop: 10,
                  height: 40
                }}
                onPress={() => {
                  openAddTopicDialog();
                }}
                title="Add first topic"
                type="grayAccent"
              />
            )}
          </View>
        }
        data={topic ? notes : currentNotebook.topics}
        renderItem={renderItem}
      />
      {selectedNoteIds.length > 0 ? (
        <Button
          //@ts-ignore
          onPress={async () => {
            await db.notes?.move(
              {
                topic: topic.id,
                id: topic.notebookId
              },
              ...selectedNoteIds
            );
            Navigation.queueRoutesForUpdate(
              'Notes',
              'Favorites',
              'ColoredNotes',
              'TaggedNotes',
              'TopicNotes',
              'Notebook',
              'Notebooks'
            );
            SearchService.updateAndSearch();
            eSendEvent(eCloseProgressDialog);
          }}
          title="Move selected notes"
          type="accent"
          width="100%"
        />
      ) : null}
    </View>
  );
};

MoveNotes.present = (notebook: any, topic: any) => {
  presentSheet({
    component: (ref: RefObject<ActionSheet>) => (
      <MoveNotes fwdRef={ref} notebook={notebook} selectedTopic={topic} />
    )
  });
};
