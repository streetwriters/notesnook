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
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Tags = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, selectionMode} = state;
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    dispatch({type: ACTIONS.TAGS});
  }, []);

  return (
    <Container
      canGoBack={false}
      heading="Tags"
      noBottomButton={true}
      placeholder="Search for #tags"
      data={tags}
      menu>
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          height: '100%',
          paddingHorizontal: 12,
        }}>
        <FlatList
          style={{
            height: '100%',
          }}
          ListHeaderComponent={
            <View
              style={{
                marginTop:
                  Platform.OS == 'ios'
                    ? tags[0] && !selectionMode
                      ? 135
                      : 135 - 60
                    : tags[0] && !selectionMode
                    ? 155
                    : 155 - 60,
              }}
            />
          }
          refreshControl={
            <RefreshControl
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressViewOffset={165}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => {
                  setRefreshing(false);
                }, 1000);
              }}
              refreshing={refreshing}
            />
          }
          contentContainerStyle={{
            height: '100%',
          }}
          data={tags}
          ListEmptyComponent={
            <View
              style={{
                height: '80%',
                width: '100%',
                alignItems: 'center',
                alignSelf: 'center',
                justifyContent: 'center',
                opacity: 0.8,
              }}>
              <TagsPlaceHolder colors={colors} />
              <Text
                style={{
                  fontSize: SIZE.sm,
                  color: colors.icon,
                }}>
                Tags added to notes appear here
              </Text>
            </View>
          }
          renderItem={({item, index}) => (
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
          )}
        />
      </View>
    </Container>
  );
};

Tags.navigationOptions = {
  header: null,
};

export default Tags;
