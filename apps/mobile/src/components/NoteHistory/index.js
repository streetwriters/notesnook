import React, {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {presentSheet} from '../../services/EventManager';
import {db} from '../../utils/database';
import {timeConverter} from '../../utils/TimeUtils';
import DialogHeader from '../Dialog/dialog-header';
import GeneralSheet from '../GeneralSheet';
import {PressableButton} from '../PressableButton';
import Seperator from '../Seperator';
import Paragraph from '../Typography/Paragraph';
import NotePreview from './preview';

export default function NoteHistory({note, ref}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state] = useTracked();
  const {colors} = state;

  useEffect(() => {
    (async () => {
      console.log(note.id);
      console.log(await db.noteHistory.get(note.id));

      setHistory([...(await db.noteHistory.get(note.id))].reverse());
      setLoading(false);
    })();
  }, []);

  async function preview(item) {
    let content = await db.noteHistory.content(item.sessionContentId);

    presentSheet({
      component: <NotePreview session={item} content={content} />,
      context: 'note_history',
      noProgress: true,
      noIcon: true
    });
  }

  const renderItem = useCallback(
    ({item, index}) => (
      <PressableButton
        type="grayBg"
        onPress={() => preview(item)}
        customStyle={{
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingHorizontal: 12,
          height: 45,
          marginBottom: 10
        }}>
        <Paragraph>{timeConverter(item.dateEdited)}</Paragraph>
      </PressableButton>
    ),
    []
  );

  return (
    <View>
      <GeneralSheet context="note_history" />
      <DialogHeader
        title="Note history"
        paragraph="Revert back to an older version of this note"
        padding={12}
      />

      <Seperator />

      <FlatList
        onMomentumScrollEnd={() => {
          ref?.current?.handleChildScrollEnd();
        }}
        style={{
          paddingHorizontal: 12
        }}
        keyExtractor={item => item.id}
        data={history}
        ListEmptyComponent={
          <View
            style={{
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200
            }}>
            <Icon name="history" size={60} color={colors.icon} />
            <Paragraph color={colors.icon}>No note history found.</Paragraph>
          </View>
        }
        renderItem={renderItem}
      />
    </View>
  );
}
