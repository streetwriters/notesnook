import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {pv, SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {TagsPlaceHolder} from '../../components/ListPlaceholders';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import NavigationService from '../../services/NavigationService';
import {ToastEvent} from '../../utils/utils';
import {useIsFocused} from 'react-navigation-hooks';
import {inputRef} from '../../components/SearchInput';
import SimpleList from '../../components/SimpleList';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Tags = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags} = state;
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      dispatch({type: ACTIONS.TAGS});
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'tags',
      });
    }
  }, [isFocused]);

  const _onRefresh = () => {
    //Handle
  };

  const _renderItem = ({item, index}) => (
    <TouchableOpacity
      key={item.title}
      onPress={() => {
        NavigationService.navigate('Notes', {
          type: 'tag',
          title: item.title,
          tag: item,
        });
      }}
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        margin: 0,
        paddingVertical: pv,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.nav,
      }}>
      <Text
        style={{
          fontFamily: WEIGHT.regular,
          fontSize: SIZE.md,
          color: colors.pri,
        }}>
        <Text
          style={{
            color: colors.accent,
          }}>
          #
        </Text>
        {item.title}
        {'\n'}
        <Text
          style={{
            fontSize: SIZE.xs,
            color: colors.icon,
          }}>
          {item && item.count && item.count > 1
            ? item.count + ' notes'
            : item.count === 1
            ? item.count + ' note'
            : null}
        </Text>
      </Text>
    </TouchableOpacity>
  );

  return (
    <Container
      canGoBack={false}
      heading="Tags"
      noBottomButton={true}
      placeholder="Search for #tags"
      data={tags}
      type="tags"
      menu>
      <View
        style={{
          paddingHorizontal: 12,
          height: '100%',
          width: '100%',
        }}>
        <SimpleList
          data={tags}
          type="tags"
          refreshing={refreshing}
          focused={isFocused}
          onRefresh={_onRefresh}
          renderItem={_renderItem}
          placeholder={<TagsPlaceHolder colors={colors} />}
          placeholderText="Tags added to notes appear here"
        />
      </View>
    </Container>
  );
};

Tags.navigationOptions = {
  header: null,
};

export default Tags;
