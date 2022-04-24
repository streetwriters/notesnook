import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import Notebook from '../../screens/notebook';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import Navigation from '../../services/navigation';
import useNavigationStore from '../../stores/use-navigation-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { db } from '../../utils/database';
import { eScrollEvent } from '../../utils/events';
import { SIZE } from '../../utils/size';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

const titleState = {};

export const Title = () => {
  const colors = useThemeStore(state => state.colors);
  const currentScreen = useNavigationStore(state => state.currentScreen);
  const isTopic = currentScreen.type === 'topic';
  const [hide, setHide] = useState(isTopic ? true : false);
  const isHidden = titleState[currentScreen.id];
  const notebook = isTopic ? db.notebooks?.notebook(currentScreen.notebookId)?.data : null;
  const title = currentScreen.title;
  const isTag = title.slice(0, 1) === '#';

  const onScroll = data => {
    if (currentScreen.name !== 'Notebook') {
      setHide(false);
      return;
    }
    if (data.y > 150) {
      if (!hide) return;
      setHide(false);
    } else {
      if (hide) return;
      setHide(true);
    }
  };

  useEffect(() => {
    if (currentScreen.name === 'Notebook') {
      let value =
        typeof titleState[currentScreen.id] === 'boolean' ? titleState[currentScreen.id] : true;
      setHide(value);
    } else {
      setHide(titleState[currentScreen.id]);
    }
  }, [currentScreen.id]);

  useEffect(() => {
    titleState[currentScreen.id] = hide;
  }, [hide]);

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [hide]);

  function navigateToNotebook() {
    if (!isTopic) return;
    Notebook.navigate(notebook, true);
  }

  return (
    <View
      style={{
        opacity: 1,
        flexShrink: 1,
        flexDirection: 'row'
      }}
    >
      {!hide && !isHidden ? (
        <Heading
          onPress={navigateToNotebook}
          numberOfLines={isTopic ? 2 : 1}
          size={isTopic ? SIZE.md + 2 : SIZE.xl}
          style={{
            flexWrap: 'wrap'
          }}
          color={currentScreen.color}
        >
          {isTopic ? (
            <Paragraph numberOfLines={1} size={SIZE.xs + 1}>
              {notebook?.title}
              {'\n'}
            </Paragraph>
          ) : null}
          {isTag ? (
            <Heading size={isTopic ? SIZE.md + 2 : SIZE.xl} color={colors.accent}>
              #
            </Heading>
          ) : null}
          {isTag ? title.slice(1) : title}
        </Heading>
      ) : null}
    </View>
  );
};
