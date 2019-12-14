import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
  onThemeUpdate,
  clearThemeUpdateListener,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import {Search} from '../../components/SearchInput';
import {useForceUpdate} from '../ListsEditor';
import {NotesList} from '../../components/NotesList';
import {AnimatedSafeAreaView} from '../Home';
import {db} from '../../../App';
import * as Animatable from 'react-native-animatable';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Notes = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(200);
  const [buttonHide, setButtonHide] = useState(false);
  const [notes, setNotes] = useState([]);
  const forceUpdate = useForceUpdate();
  let params = navigation.state ? navigation.state.params : null;
  let offsetY = 0;
  let countUp = 0;
  let countDown = 0;
  let headerHeight = 0;
  let searchHeight = 0;
  let marginSet = false;
  useEffect(() => {
    onThemeUpdate(() => {
      forceUpdate();
    });
    return () => {
      clearThemeUpdateListener(() => {
        forceUpdate();
      });
    };
  }, []);

  useEffect(() => {
    if (!params) {
      params = {
        heading: 'Notes',
      };
    }
  }, []);

  useEffect(() => {
    let allNotes = db.getTopic(params.notebookID, params.title);
    if (allNotes && allNotes.length > 0) {
      setNotes(allNotes);
    }
  }, []);

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
            backgroundColor: colors.bg,
            zIndex: 10,
            width: '100%',
          }}>
          <Header
            sendHeight={height => (headerHeight = height)}
            hide={hideHeader}
            showSearch={() => {
              setHideHeader(false);
              countUp = 0;
              countDown = 0;
            }}
            colors={colors}
            canGoBack={false}
            colors={colors}
            heading={params.title}
            canGoBack={true}
          />
          <Search
            sendHeight={height => {
              searchHeight = height;
            }}
            placeholder={`Search in ${params.title}`}
            hide={hideHeader}
          />
        </Animatable.View>

        <NotesList
          margin={margin}
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
          isSearch={false}
          notes={notes}
          keyword={null}
        />

        <TouchableOpacity
          activeOpacity={opacity}
          onPress={() => {
            setAddNotebook(true);
          }}
          style={{
            borderRadius: 5,
            width: '90%',
            marginHorizontal: '5%',
            paddingHorizontal: ph,
            paddingVertical: pv + 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
            backgroundColor: colors.accent,
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.semibold,
              color: 'white',
            }}>
            <Icon name="plus" color="white" size={SIZE.lg} />
            {'  '} Create a new note
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

Notes.navigationOptions = {
  header: null,
};

export default Notes;
