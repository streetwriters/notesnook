import React, { useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { eSendEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { db } from '../../utils/database';
import { eOpenTagsDialog, refreshNotesPage } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import { Button } from '../Button';

export const Tags = ({ item, close }) => {
  const [state] = useTracked();
  const { colors } = state;

  return item.id ? (
    <View
      style={{
        marginTop: 5,
        marginBottom: 5
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <Button
          onPress={async () => {
            close();
            await sleep(300);
            eSendEvent(eOpenTagsDialog, item);
          }}
          buttonType={{
            text: colors.accent
          }}
          title="Add tags"
          type="grayBg"
          icon="plus"
          iconPosition="right"
          height={25}
          fontSize={SIZE.xs + 1}
          style={{
            marginRight: 5,
            borderRadius: 100,
            paddingHorizontal: 8
          }}
        />
        {item.tags.map((item, index) =>
          item ? <TagItem key={item} tag={item} close={close} /> : null
        )}
      </View>
    </View>
  ) : null;
};

const TagItem = ({ tag, close }) => {
  const onPress = async () => {
    let tags = db.tags.all;
    let _tag = tags.find(t => t.title === tag);
    let params = {
      ..._tag,
      type: 'tag',
      get: 'tagged'
    };

    eSendEvent(refreshNotesPage, params);
    Navigation.navigate('NotesPage', params, {
      heading: '#' + _tag.title,
      id: _tag.id,
      type: _tag.type
    });
    await sleep(300);
    close();
  };

  const style = {
    paddingHorizontal: 8,
    marginVertical: 5,
    borderRadius: 100,
    marginRight: 5
  };

  return (
    <Button
      onPress={onPress}
      title={'#' + tag}
      // buttonType={{
      //   text: colors.accent
      // }}
      type="grayBg"
      height={25}
      fontSize={SIZE.xs + 1}
      style={style}
    />
  );
};
