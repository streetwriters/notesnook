import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import {SIZE, ph, pv, opacity, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {AddNotebookDialog} from '../../components/AddNotebookDialog';
import {NotebookItem} from '../../components/NotebookItem';
import {Search} from '../../components/SearchInput';
import {db} from '../../../App';
import {Header} from '../../components/header';
import {AnimatedSafeAreaView} from '../Home';
import * as Animatable from 'react-native-animatable';
import {NavigationEvents} from 'react-navigation';
import {useAppContext} from '../../provider/useAppContext';
import {NotebookPlaceHolder} from '../../components/ListPlaceholders';
import {slideRight, slideLeft} from '../../utils/animations';
import {useIsFocused} from 'react-navigation-hooks';
import {w} from '../../utils/utils';
export const Folders = ({navigation}) => {
  const {colors} = useAppContext();

  const [addNotebook, setAddNotebook] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [hideHeader, setHideHeader] = useState(false);
  const [buttonHide, setButtonHide] = useState(false);
  const [margin, setMargin] = useState(180);
  const [numColumns, setNumColumns] = useState(1);
  const [pinned, setPinned] = useState([]);
  const isFocused = useIsFocused();

  const params = navigation.state.params;
  let offsetY = 0;
  let countUp = 0;
  let countDown = 0;
  let headerHeight = 0;
  let searchHeight = 0;
  let marginSet = false;

  useEffect(() => {
    if (isFocused) {
      setNotebooks([...db.getNotebooks()]);

      let pinItems = db.getPinned();

      setPinned([...pinItems]);
    }
  }, [isFocused]);

  const refreshNotebooks = () => {
    let nb = db.getNotebooks();
    if (nb) {
      setNotebooks([...nb]);
    }
  };

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <NavigationEvents
        onDidBlur={() => {
          marginSet = false;
        }}
      />
      <AddNotebookDialog
        visible={addNotebook}
        close={newNotes => {
          setAddNotebook(false);
          if (newNotes) {
            setNotebooks(db.getNotebooks());
          }
        }}
      />
      <KeyboardAvoidingView
        style={{
          height: '100%',
        }}>
        <Animatable.View
          transition="backgroundColor"
          duration={300}
          style={{
            position: 'absolute',
            backgroundColor: colors.bg,
            zIndex: 10,
            width: '100%',
          }}>
          <Header
            hide={hideHeader}
            menu={params.canGoBack ? false : true}
            showSearch={() => {
              setHideHeader(false);
              countUp = 0;
              countDown = 0;
            }}
            colors={colors}
            heading={params.title}
            canGoBack={params.canGoBack}
          />
          {notebooks.length == 0 ? null : (
            <Search placeholder="Search your notebook" hide={hideHeader} />
          )}
        </Animatable.View>

        <FlatList
          style={{
            width: '100%',
          }}
          onScroll={event => {
            y = event.nativeEvent.contentOffset.y;
            if (y < 30) setHideHeader(false);
            if (buttonHide) return;
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
          ListHeaderComponent={
            <View
              style={{
                marginTop:
                  Platform.OS == 'ios'
                    ? notebooks[0]
                      ? 135
                      : 135 - 60
                    : notebooks[0]
                    ? 155
                    : 155 - 60,
              }}>
              {pinned && pinned.length > 0 ? (
                <>
                  <FlatList
                    data={pinned}
                    keyExtractor={(item, index) => item.dateCreated.toString()}
                    renderItem={({item, index}) =>
                      item.type === 'notebook' ? (
                        <NoteItem
                          customStyle={{
                            backgroundColor: colors.shade,
                            width: '100%',
                            paddingHorizontal: '5%',
                            paddingTop: 20,
                            marginBottom: 10,
                            marginTop: 20,
                            borderBottomWidth: 0,
                          }}
                          pinned={true}
                          refresh={() => refresh()}
                          item={item}
                          numColumns={1}
                          index={index}
                        />
                      ) : null
                    }
                  />
                </>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            pinned && pinned.length > 0 ? null : (
              <View
                style={{
                  height: '80%',
                  width: '100%',
                  alignItems: 'center',
                  alignSelf: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                }}>
                <NotebookPlaceHolder animation={slideRight} colors={colors} />
                <NotebookPlaceHolder animation={slideLeft} colors={colors} />
                <NotebookPlaceHolder animation={slideRight} colors={colors} />

                <Text
                  style={{
                    color: colors.icon,
                    fontSize: SIZE.md,
                    fontFamily: WEIGHT.regular,
                    marginTop: 20,
                  }}>
                  Notebooks you add will appear here
                </Text>
                <Text
                  style={{
                    fontSize: SIZE.sm,
                    color: colors.icon,
                    marginTop: 20,
                  }}>
                  No Notebooks found
                </Text>
              </View>
            )
          }
          contentContainerStyle={{
            width: '100%',
            alignSelf: 'center',
          }}
          ListFooterComponent={
            <View
              style={{
                height: 150,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: colors.navbg,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                }}>
                - End -
              </Text>
            </View>
          }
          data={notebooks}
          keyExtractor={(item, index) => item.dateCreated.toString()}
          renderItem={({item, index}) => (
            <NotebookItem
              hideMore={params.hideMore}
              isMove={params.isMove}
              noteToMove={params.note}
              item={item}
              numColumns={numColumns}
              refresh={() => refreshNotebooks()}
              index={index}
              colors={colors}
            />
          )}
        />
        <TouchableOpacity
          activeOpacity={opacity}
          onPress={() => {
            setAddNotebook(true);
          }}
          style={{
            borderRadius: 5,
            width: w - 24,
            marginHorizontal: 12,
            paddingHorizontal: ph,
            paddingVertical: pv + 5,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: 15,
            backgroundColor: colors.accent,
          }}>
          <Icon name="plus" color="white" size={SIZE.lg} />
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              color: 'white',
            }}>
            {'  '}Create a new notebook
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

Folders.navigationOptions = {
  header: null,
};

export default Folders;
