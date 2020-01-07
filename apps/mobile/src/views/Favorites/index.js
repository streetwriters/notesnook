import React, {useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  View,
  Text,
  FlatList,
  Platform,
} from 'react-native';
import {Header} from '../../components/header';
import {AnimatedSafeAreaView} from '../Home';
import {useAppContext} from '../../provider/useAppContext';
import * as Animatable from 'react-native-animatable';
import {Search} from '../../components/SearchInput';
import {db} from '../../../App';

import {SIZE, WEIGHT} from '../../common/common';
import NoteItem from '../../components/NoteItem';
import {NotebookItem} from '../../components/NotebookItem';
import {FavoritesPlaceHolder} from '../../components/ListPlaceholders';

export const Favorites = ({navigation}) => {
  // Global State

  const {colors} = useAppContext();

  // Local State

  const [text, setText] = useState('');
  const [margin, setMargin] = useState(185);
  const [hideHeader, setHideHeader] = useState(false);
  const [favs, setFavs] = useState([]);
  const [buttonHide, setButtonHide] = useState(false);

  // Variables

  let offsetY = 0;
  let countUp = 1;
  let countDown = 0;

  // Functions

  const fetchFavs = () => {
    let favs = db.getFavorites();
    if (!favs) return;
    setFavs([...favs]);
  };

  const slideRight = {
    0: {
      transform: [{translateX: -4}],
    },
    0.5: {
      transform: [{translateX: 0}],
    },
    1: {
      transform: [{translateX: 4}],
    },
  };
  const slideLeft = {
    0: {
      transform: [{translateX: 4}],
    },
    0.5: {
      transform: [{translateX: 0}],
    },
    1: {
      transform: [{translateX: -4}],
    },
  };

  // Effects

  useEffect(() => {
    fetchFavs();
  }, []);

  // Render

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <KeyboardAvoidingView
        style={{
          height: '100%',
        }}>
        <Animatable.View
          transition="backgroundColor"
          duration={300}
          style={{
            position: 'absolute',
            backgroundColor: colors.night ? colors.bg : colors.bg,
            zIndex: 10,
            width: '100%',
          }}>
          <Header
            menu={true}
            hide={hideHeader}
            showSearch={() => {
              setHideHeader(false);
              countUp = 0;
              countDown = 0;
            }}
            colors={colors}
            heading="Favorites"
            canGoBack={false}
            customIcon="menu"
          />
          {favs.length > 0 ? (
            <Search
              clear={() => setText('')}
              hide={hideHeader}
              placeholder="Search your notes"
              value={text}
            />
          ) : null}
        </Animatable.View>

        <FlatList
          //keyExtractor={item => item.dateCreated.toString()}
          style={{
            width: '100%',
            alignSelf: 'center',
            height: '100%',
          }}
          contentContainerStyle={{
            height: '100%',
          }}
          ListHeaderComponent={
            <View
              style={{
                marginTop:
                  Platform.OS == 'ios'
                    ? favs[0]
                      ? 135
                      : 135 - 60
                    : favs[0]
                    ? 175
                    : 175 - 60,
              }}></View>
          }
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
              <FavoritesPlaceHolder />
              <Text
                style={{
                  color: colors.pri,
                  fontSize: SIZE.md,
                  fontFamily: WEIGHT.regular,
                  marginTop: 20,
                }}>
                Favorite notes & notebooks appear here.
              </Text>
              <Text
                style={{
                  fontSize: SIZE.sm,
                  color: colors.icon,
                  marginTop: 20,
                }}>
                Favorites are empty.
              </Text>
            </View>
          }
          data={favs}
          onScroll={event => {
            let y = event.nativeEvent.contentOffset.y;
            if (buttonHide) return;
            if (y < 30) setHideHeader(false);
            if (y > offsetY) {
              if (y - offsetY < 150 || countDown > 0) return;
              countDown = 1;
              countUp = 0;
              setHideHeader(true);
            } else {
              if (offsetY - y < 150 || countUp > 0) return;
              countDown = 0;
              countUp = 1;
              setHideHeader(false);
            }
            offsetY = y;
          }}
          renderItem={({item, index}) =>
            item.type === 'note' ? (
              <NoteItem
                item={item}
                refresh={() => {
                  fetchFavs();
                }}
                index={index}
              />
            ) : (
              <NotebookItem
                item={item}
                refresh={() => {
                  fetchFavs();
                }}
                index={index}
              />
            )
          }
        />
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

Favorites.navigationOptions = {
  header: null,
};

export default Favorites;
