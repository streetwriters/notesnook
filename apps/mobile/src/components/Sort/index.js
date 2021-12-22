import React, {useState} from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {GROUP, SORT} from '../../utils';
import {db} from '../../utils/database';
import { refreshNotesPage } from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';

const Sort = ({type, screen}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const [groupOptions, setGroupOptions] = useState(
    db.settings.getGroupOptions(type)
  );

  const updateGroupOptions = async _groupOptions => {
    await db.settings.setGroupOptions(type, _groupOptions);
    setGroupOptions(_groupOptions);
    setTimeout(() => {
      Navigation.setRoutesToUpdate([screen]);
      eSendEvent('groupOptionsUpdate');
      eSendEvent(refreshNotesPage);
    }, 1);
  };

  const setOrderBy = async () => {
    let _groupOptions = {
      ...groupOptions,
      sortDirection: groupOptions.sortDirection === 'asc' ? 'desc' : 'asc'
    };
    await updateGroupOptions(_groupOptions);
  };

  return (
    <View
      style={{
        width: '100%',
        backgroundColor: colors.bg,
        justifyContent: 'space-between',
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12
        }}>
        <Heading
          size={SIZE.xl}
          style={{
            alignSelf: 'center'
          }}>
          Sort by
        </Heading>

        <Button
          title={
            groupOptions.sortDirection === 'asc'
              ? groupOptions.groupBy === 'abc'
                ? 'A - Z'
                : 'Old - New'
              : groupOptions.groupBy === 'abc'
              ? 'Z - A'
              : 'New - Old'
          }
          icon={
            groupOptions.sortDirection === 'asc'
              ? 'sort-ascending'
              : 'sort-descending'
          }
          height={25}
          iconPosition="right"
          fontSize={SIZE.sm - 1}
          type="grayBg"
          buttonType={{
            text: colors.accent
          }}
          style={{
            borderRadius: 100,
            paddingHorizontal: 6
          }}
          onPress={setOrderBy}
        />
      </View>

      <Seperator />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
          marginBottom: 12,
          paddingHorizontal: 12,
          paddingBottom: 12,
          alignItems: 'center'
        }}>
        {groupOptions.groupBy === 'abc' ? (
          <Button
            type={'grayBg'}
            title="Title"
            height={45}
            iconPosition="left"
            icon={'check'}
            buttonType={{text: colors.accent}}
            fontSize={SIZE.sm}
            iconSize={SIZE.md}
          />
        ) : (
          Object.keys(SORT).map((item, index) => (
            <Button
              key={item}
              type={groupOptions.sortBy === item ? 'grayBg' : 'gray'}
              title={SORT[item]}
              height={45}
              iconPosition="left"
              icon={groupOptions.sortBy === item ? 'check' : null}
              style={{
                marginRight: 10
              }}
              buttonType={{
                text: groupOptions.sortBy === item ? colors.accent : colors.icon
              }}
              fontSize={SIZE.sm}
              onPress={async () => {
                let _groupOptions = {
                  ...groupOptions,
                  sortBy: type === 'trash' ? 'dateDeleted' : item
                };
                await updateGroupOptions(_groupOptions);
              }}
              iconSize={SIZE.md}
            />
          ))
        )}
      </View>

      <Heading
        style={{
          marginLeft: 12
        }}
        size={SIZE.lg}>
        Group by
      </Heading>

      <Seperator />

      <View
        style={{
          paddingHorizontal: 0,
          borderRadius: 0,
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 12
        }}>
        {Object.keys(GROUP).map((item, index) => (
          <Button
            key={item}
            testID={'btn-' + item}
            type={groupOptions.groupBy === GROUP[item] ? 'grayBg' : 'gray'}
            buttonType={{
              text:
                groupOptions.groupBy === GROUP[item]
                  ? colors.accent
                  : colors.icon
            }}
            onPress={async () => {
              let _groupOptions = {
                ...groupOptions,
                groupBy: GROUP[item]
              };

              if (item === 'abc') {
                _groupOptions.sortBy = 'title';
                _groupOptions.sortDirection = 'asc';
              } else {
                if (groupOptions.sortBy === 'title') {
                  _groupOptions.sortBy = 'dateEdited';
                }
              }
              updateGroupOptions(_groupOptions);
            }}
            icon={groupOptions.groupBy === GROUP[item] ? 'check' : null}
            title={item.slice(0, 1).toUpperCase() + item.slice(1, item.length)}
            style={{
              paddingHorizontal: 12,
              marginBottom: 10,
              marginRight: 10
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default Sort;
