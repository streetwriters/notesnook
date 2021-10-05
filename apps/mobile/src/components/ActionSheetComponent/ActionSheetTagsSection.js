import React, {useState} from 'react';
import {View} from 'react-native';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/database';
import {refreshNotesPage} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';

export const ActionSheetTagsSection = ({item, close}) => {
  const [note, setNote] = useState(item);

  return note.id || note.dateCreated ? (
    <View
      style={{
        marginHorizontal: 12,
      }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {note.tags.map(
          (item, index) =>
            item && <TagItem key={item} tag={item} close={close} />,
        )}
      </View>
    </View>
  ) : null;
};

const TagItem = ({tag, close}) => {
  const onPress = async () => {
    let tags = db.tags.all;
    let _tag = tags.find(t => t.title === tag);
    let params = {
      ..._tag,
      type: 'tag',
      get: 'tagged',
    };

    eSendEvent(refreshNotesPage, params);
    Navigation.navigate('NotesPage', params, {
      heading: '#' + _tag.title,
      id: _tag.id,
      type: _tag.type,
    });
    await sleep(300);
    close();
  };

  const style = {
    paddingHorizontal: 0,
    paddingHorizontal: 6,
    marginVertical: 5,
  };

  return (
    <Button
      onPress={onPress}
      title={'#' + tag}
      type="gray"
      height={30}
      fontSize={SIZE.sm}
      style={style}
    />
  );
};
