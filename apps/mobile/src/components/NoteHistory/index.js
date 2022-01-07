import React, {useCallback, useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {presentSheet} from '../../services/EventManager';
import {db} from '../../utils/database';
import { openLinkInBrowser } from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import {timeConverter, timeSince} from '../../utils/TimeUtils';
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
      setHistory([...(await db.noteHistory.get(note.id))]);
      setLoading(false);
    })();
  }, []);

  async function preview(item) {
    let content = await db.noteHistory.content(item.id);

    presentSheet({
      component: (
        <NotePreview
          session={{
            ...item,
            session: getDate(item.dateCreated, item.dateModified)
          }}
          content={content}
        />
      ),
      context: 'note_history',
    });
  }

  const getDate = (start, end) => {
    let _start = timeConverter(start);
    let _end = timeConverter(end + 60000);
    if (_start === _end) return _start;
    let final = _end.lastIndexOf(',');
    let part = _end.slice(0, final + 1);
    if (_start.includes(part)) {
      return _start + ' —' + _end.replace(part, '');
    }
    return _start + ' — ' + _end;
  };

  const renderItem = useCallback(
    ({item, index}) => (
      <PressableButton
        type="grayBg"
        onPress={() => preview(item)}
        customStyle={{
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          height: 45,
          marginBottom: 10,
          flexDirection: 'row'
        }}>
        <Paragraph>{getDate(item.dateCreated, item.dateModified)}</Paragraph>
        <Paragraph color={colors.icon} size={SIZE.xs}>
          {timeSince(item.dateModified)}
        </Paragraph>
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
            <Paragraph color={colors.icon}>
              No note history found on this device.
            </Paragraph>
          </View>
        }
        renderItem={renderItem}
      />
      <Paragraph
        size={SIZE.xs}
        color={colors.icon}
        style={{
          alignSelf: 'center'
        }}>
        Note version history is local only.{' '}
        <Text 
        onPress={() => {
          openLinkInBrowser("https://docs.notesnook.com/versionhistory",colors);
        }}
        style={{color: colors.accent, textDecorationLine: 'underline'}}>
          Learn how this works.
        </Text>
      </Paragraph>
    </View>
  );
}
