import React, {useEffect, useState} from 'react';
import {Dimensions, KeyboardAvoidingView} from 'react-native';

import {Header} from '../../components/header';
import {AnimatedSafeAreaView} from '../Home';
import {useAppContext} from '../../provider/useAppContext';
import * as Animatable from 'react-native-animatable';
import {Search} from '../../components/SearchInput';
import {db} from '../../../App';
import {NotesList} from '../../components/NotesList';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

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

        <NotesList
          margin={margin}
          refresh={() => {
            fetchFavs();
          }}
          onScroll={y => {
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
          isFavorites={true}
          isSearch={false}
          emptyPlaceholderText="Your favorite notes will appear here"
          notes={favs}
          keyword={''}
        />
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

Favorites.navigationOptions = {
  header: null,
};

export default Favorites;
