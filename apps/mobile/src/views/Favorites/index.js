import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {Header} from '../../components/header';
import {FavoritesPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import NoteItem from '../../components/NoteItem';
import {Search} from '../../components/SearchInput';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';

export const Favorites = ({navigation}) => {
  // Global State
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, favorites} = state;

  // Local State
  const [text, setText] = useState('');
  const [hideHeader, setHideHeader] = useState(false);
  const [buttonHide, setButtonHide] = useState(false);

  // Variables

  let offsetY = 0;
  let countUp = 1;
  let countDown = 0;

  useEffect(() => {
    dispatch({type: ACTIONS.FAVORITES});
  }, []);

  // Functions

  // Effects
  const onScroll = event => {
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
  };
  // Render

  return (
    <Container noBottomButton={true}>
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
        {favorites.length > 0 ? (
          <Search
            clear={() => setText('')}
            hide={hideHeader}
            placeholder="Search your notes"
            value={text}
          />
        ) : null}
      </Animatable.View>

      <FlatList
        keyExtractor={item => item.dateCreated.toString()}
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
                  ? favorites[0]
                    ? 135
                    : 135 - 60
                  : favorites[0]
                  ? 155
                  : 155 - 60,
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
        data={favorites}
        onScroll={onScroll}
        renderItem={({item, index}) => (
          <SelectionWrapper item={item}>
            {item.type === 'note' ? (
              <NoteItem
                customStyle={{
                  width: selectionMode ? w - 74 : '100%',
                  marginHorizontal: 0,
                }}
                colors={colors}
                onLongPress={() => {
                  dispatch({
                    type: ACTIONS.SELECTION_MODE,
                    enabled: !selectionMode,
                  });
                  dispatch({
                    type: ACTIONS.SELECTED_ITEMS,
                    item: item,
                  });
                }}
                item={item}
                index={index}
                isTrash={false}
              />
            ) : (
              <NotebookItem
                onLongPress={() => {
                  dispatch({
                    type: ACTIONS.SELECTION_MODE,
                    enabled: !selectionMode,
                  });
                  dispatch({
                    type: ACTIONS.SELECTED_ITEMS,
                    item: item,
                  });
                }}
                customStyle={{
                  width: selectionMode ? w - 74 : '100%',
                  marginHorizontal: 0,
                }}
                item={item}
                isTrash={false}
                index={index}
              />
            )}
          </SelectionWrapper>
        )}
      />
    </Container>
  );
};

Favorites.navigationOptions = {
  header: null,
};

export default Favorites;
