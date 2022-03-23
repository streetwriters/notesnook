import React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useThemeStore } from '../../stores/theme';
import { DDS } from '../../services/device-detection';
import { presentSheet } from '../../services/event-manager';
import { db } from '../../utils/database';
import { SIZE } from '../../utils/size';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
import { ColorTags } from './color-tags';
import { DateMeta } from './date-meta';
import { DevMode } from './dev-mode';
import { Items } from './items';
import Notebooks from './notebooks';
import { Synced } from './synced';
import { Tags } from './tags';
import { Topics } from './topics';
import SearchService from '../../services/search';

export const Properties = ({ close = () => {}, item, buttons = [], getRef }) => {
  const colors = useThemeStore(state => state.colors);

  const alias = item
    ? item.type === 'tag'
      ? db.tags.alias(item.id)
      : item.type === 'color'
      ? db.colors.alias(item.id)
      : item.title
    : null;

  const onScrollEnd = () => {
    getRef().current?.handleChildScrollEnd();
  };

  return (
    <ScrollView
      nestedScrollEnabled
      onMomentumScrollEnd={onScrollEnd}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: 0,
        borderBottomRightRadius: DDS.isLargeTablet() ? 10 : 1,
        borderBottomLeftRadius: DDS.isLargeTablet() ? 10 : 1
      }}
    >
      {!item || !item.id ? (
        <Paragraph style={{ marginVertical: 10, alignSelf: 'center' }}>
          Start writing to save your note.
        </Paragraph>
      ) : (
        <View
          style={{
            marginTop: 5,
            zIndex: 10
          }}
        >
          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            <Heading size={SIZE.lg}>
              {item.type === 'tag' ? '#' : null}
              {alias}
            </Heading>

            {item.headline || item.description ? (
              <Paragraph
                style={{
                  marginBottom: 5
                }}
                numberOfLines={2}
                color={colors.icon}
              >
                {(item.type === 'notebook' || item.itemType === 'notebook') && item?.description
                  ? item.description
                  : null}
                {(item.type === 'note' || item.itemType === 'note') && item?.headline
                  ? item.headline
                  : null}
              </Paragraph>
            ) : null}

            {item.type === 'note' ? <Tags close={close} item={item} /> : null}

            <Topics item={item} close={close} />
          </View>

          {item.type === 'note' ? <Notebooks note={item} close={close} /> : null}

          <DateMeta item={item} />
        </View>
      )}

      <View
        style={{
          borderTopWidth: 1,
          borderColor: colors.nav
        }}
      />

      {item.type === 'note' ? <ColorTags close={close} item={item} /> : null}

      <Items
        item={item}
        buttons={buttons}
        close={() => {
          close();
          setTimeout(() => {
            SearchService.updateAndSearch();
          }, 1000);
        }}
      />
      <Synced item={item} close={close} />
      <DevMode item={item} />

      {DDS.isTab ? (
        <View
          style={{
            height: 20
          }}
        />
      ) : null}
    </ScrollView>
  );
};

Properties.present = (item, buttons = []) => {
  if (!item) return;
  let type = item?.type;
  let props = [];
  let android = [];
  switch (type) {
    case 'trash':
      props[0] = item;
      props.push(['PermDelete', 'Restore']);
      break;
    case 'note':
      android = Platform.OS === 'android' ? ['PinToNotif'] : [];
      props[0] = db.notes.note(item.id).data;
      props.push([
        'Add to notebook',
        'Share',
        'Export',
        'Copy',
        'Publish',
        'Pin',
        'Favorite',
        'Attachments',
        'Vault',
        'Delete',
        'RemoveTopic',
        'History',
        'ReadOnly',
        'Local only',
        'Duplicate',
        ...android,
        ...buttons
      ]);
      break;
    case 'notebook':
      props[0] = db.notebooks.notebook(item.id).data;
      props.push(['Edit Notebook', 'Pin', 'Add Shortcut', 'Delete']);
      break;
    case 'topic':
      props[0] = db.notebooks.notebook(item.notebookId).topics.topic(item.id)._topic;
      props.push(['Move notes', 'Edit Topic', 'Add Shortcut', 'Delete']);
      break;
    case 'tag':
      props[0] = db.tags.tag(item.id);
      props.push(['Add Shortcut', 'Delete', 'Rename Tag']);
      break;
  }
  if (!props[0]) return;
  presentSheet({
    component: (ref, close) => (
      <Properties
        close={() => {
          close();
        }}
        getRef={() => ref}
        item={props[0]}
        buttons={props[1]}
      />
    )
  });
};
