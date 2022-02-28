import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { eOnNewTopicAdded, eScrollEvent } from '../../utils/events';
import { SIZE } from '../../utils/size';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

export const Title = ({ heading, headerColor, screen, notebook }) => {
  const [state] = useTracked();
  const { colors } = state;
  const [hide, setHide] = useState(screen === 'Notebook' ? true : false);

  const onScroll = data => {
    if (screen !== 'Notebook') {
      setHide(false);
      return;
    }
    if (data.y > 150) {
      setHide(false);
    } else {
      setHide(true);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);

  function navigateToNotebook() {
    if (!notebook) return;
    let routeName = 'Notebook';
    let params = {
      menu: false,
      notebook: notebook,
      title: notebook.title
    };
    let headerState = {
      heading: notebook.title,
      id: notebook.id,
      type: notebook.type
    };
    eSendEvent(eOnNewTopicAdded, params);
    Navigation.navigate(routeName, params, headerState);
  }

  return (
    <View
      style={{
        opacity: 1,
        flexShrink: 1,
        flexDirection: 'row'
      }}
    >
      {!hide ? (
        <Heading
          onPress={navigateToNotebook}
          numberOfLines={notebook ? 2 : 1}
          size={notebook ? SIZE.md + 2 : SIZE.xl}
          style={{
            flexWrap: 'wrap'
          }}
          color={headerColor}
        >
          {notebook ? (
            <Paragraph numberOfLines={1} size={SIZE.xs + 1}>
              {notebook?.title}
              {'\n'}
            </Paragraph>
          ) : null}
          <Heading color={colors.accent}>{heading.slice(0, 1) === '#' ? '#' : null}</Heading>
          {heading.slice(0, 1) === '#' ? heading.slice(1) : heading}
        </Heading>
      ) : null}
    </View>
  );
};
