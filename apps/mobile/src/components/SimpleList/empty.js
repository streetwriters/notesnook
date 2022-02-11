import React from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import * as Progress from 'react-native-progress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTracked } from '../../provider';
import { useTip } from '../../services/tip-manager';
import { COLORS_NOTE } from '../../utils/Colors';
import { SIZE } from '../../utils/SizeUtils';
import { Button } from '../Button';
import Seperator from '../Seperator';
import { Tip } from '../Tip';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const Empty = ({ loading = true, placeholderData, headerProps, type, screen }) => {
  const [state] = useTracked();
  const { colors } = state;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const tip = useTip(
    screen === 'Notes' ? 'first-note' : placeholderData.type || type,
    screen === 'Notes' ? 'notes' : null
  );
  const color =
    colors[COLORS_NOTE[headerProps.color?.toLowerCase()] ? headerProps.color : 'accent'];

  return (
    <View
      style={[
        {
          height: height - (140 + insets.top),
          width: '80%',
          justifyContent: 'center',
          alignSelf: 'center'
        }
      ]}
    >
      {!loading ? (
        <>
          <Tip
            color={COLORS_NOTE[headerProps.color?.toLowerCase()] ? headerProps.color : 'accent'}
            tip={tip}
            style={{
              backgroundColor: 'transparent',
              paddingHorizontal: 0
            }}
          />
          {placeholderData.button && (
            <Button
              type="grayAccent"
              title={placeholderData.button}
              iconPosition="right"
              icon="arrow-right"
              onPress={placeholderData.action}
              accentColor={
                COLORS_NOTE[headerProps.color?.toLowerCase()] ? headerProps.color : 'accent'
              }
              accentText="light"
              style={{
                alignSelf: 'flex-start',
                borderRadius: 5,
                height: 40
              }}
            />
          )}
        </>
      ) : (
        <>
          <View
            style={{
              alignSelf: 'center',
              alignItems: 'flex-start',
              width: '100%'
            }}
          >
            <Heading>{placeholderData.heading}</Heading>
            <Paragraph size={SIZE.sm} textBreakStrategy="balanced">
              {placeholderData.loading}
            </Paragraph>
            <Seperator />
            <ActivityIndicator
              size={SIZE.lg}
              color={COLORS_NOTE[headerProps.color?.toLowerCase()] || colors.accent}
            />
          </View>
        </>
      )}
    </View>
  );
};

/**
 * Make a tips manager.
 * The tip manager stores many tips. Each tip has following values
 * 1. Text
 * 2. contexts: An array of context strings. // Places where the tip can be shown
 * 3. Button if any.
 * 4. Image/Gif asset.
 *
 * Tip manager adds the following methods -> get(context). Returns a random tip for the following context.
 *
 * Tips can be shown in a sheet or in a list. For sheets, GeneralSheet can be used to
 * render tips.
 *
 * Where can the tips be shown and how?
 * 1. When transitioning, show tips in a sheet. Make sure its useful
 * 2. Replace placeholders with tips.
 * 3. Show tips in editor placeholder.
 * 4. Show tips between list items?
 *
 * Tooltips.
 * Small tooltips can be shown in initial render first time.
 * Especially for items that are not shown on blank page. Should be
 * in places where it makes sense and does not interrupt the user.
 *
 * Can also be shown when first time entering a screen that
 * has something that the user might not know of. Like sorting and side menu.
 *
 * Todo:
 * 1. Make a tip manager.
 * 2. Make a list of tips.
 * 3. Add images for those tips.
 * 4. Show tips
 */
