import React, {createRef, useCallback, useEffect, useState} from 'react';
import {Text} from 'react-native';
import {TextInput, TouchableOpacity, View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/DB';
import {eOpenTagsDialog, refreshNotesPage} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';

const tagsInputRef = createRef();
let prevQuery = null;
let tagToAdd = '';
let backPressCount = 0;

export const ActionSheetTagsSection = ({item, close}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
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
        }}>
        {note.tags.map(
          (item, index) => item && <TagItem key={item} tag={item} />,
        )}

        <Button
          onPress={async () => {
            close();
            await sleep(300);
            eSendEvent(eOpenTagsDialog, note);
          }}
          title="Add new tag"
          type="accent"
          icon="plus"
          iconPosition="right"
          height={30}
          fontSize={SIZE.sm}
          style={{
            margin: 1,
            marginRight: 5,
            paddingHorizontal: 0,
            borderRadius: 100,
            paddingHorizontal: 12,
          }}
        />
      </View>
    </View>
  ) : null;
};

const TagItem = ({tag}) => {
  const onPress = async () => {
    let params = (params = {
      ...item,
      type: 'tag',
      menu: false,
      get: 'tagged',
    });
    Navigation.navigate('NotesPage', params, {
      heading: '#' + tag.title,
      id: tag.id,
      type: tag.type,
    });
    eSendEvent(refreshNotesPage, params);
    close();
  };

  const style = {
    margin: 1,
    marginRight: 5,
    paddingHorizontal: 0,
    borderRadius: 100,
    paddingHorizontal: 12,
  };

  return (
    <Button
      onPress={onPress}
      title={'#' + tag}
      type="grayBg"
      height={30}
      fontSize={SIZE.sm}
      style={style}
    />
  );
};
