import React, {useEffect} from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {pv, SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import {TagsPlaceHolder} from '../../components/ListPlaceholders';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {db} from '../../../App';
import NavigationService from '../../services/NavigationService';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Tags = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags} = state;

  useEffect(() => {
    dispatch({type: ACTIONS.TAGS});
  }, []);

  return (
    <SafeAreaView
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <Header canGoBack={false} heading="Tags" menu={true} />

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
                  fontSize: SIZE.md,
                  color: colors.icon,
                }}>
                Tags added to notes appear here
              </Text>
              <Text
                style={{
                  fontSize: SIZE.sm,
                  color: colors.icon,
                  marginTop: 20,
                }}>
                No tags found
              </Text>
            </View>
          }
          renderItem={({item, index}) => (
            <TouchableOpacity
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
                  {item.count} note
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

Tags.navigationOptions = {
  header: null,
};

export default Tags;
