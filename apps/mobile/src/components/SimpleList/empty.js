import React from 'react';
import { ActivityIndicator, Image, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notesnook } from '../../../e2e/test.ids';
import { useTracked } from '../../provider';
import { TipManager, useTip } from '../../services/tip-manager';
import { getElevation } from '../../utils';
import { COLORS_NOTE } from '../../utils/Colors';
import { normalize, SIZE } from '../../utils/SizeUtils';
import { Button } from '../Button';
import { Placeholder } from '../ListPlaceholders';
import Seperator from '../Seperator';
import { Tip } from '../Tip';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const Empty = ({ loading = true, placeholderData, absolute, headerProps, type, screen }) => {
  const [state] = useTracked();
  const { colors } = state;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const tip = useTip(
    screen === 'Notes' ? 'first-note' : placeholderData.type || type,
    screen === 'Notes' ? 'notes' : null
  );

  return (
    <View
      style={[
        {
          position: absolute ? 'absolute' : 'relative',
          zIndex: absolute ? 10 : null,
          height: height - 140 - insets.top,
          width: '80%',
          justifyContent: 'center',
          alignSelf: 'center'
        }
      ]}
    >
      <Tip
        color={COLORS_NOTE[headerProps.color?.toLowerCase()] ? headerProps.color : 'accent'}
        tip={tip}
      />
      {!loading ? (
        <Button
          type="accent"
          title={placeholderData.button}
          iconPosition="right"
          icon="arrow-right"
          onPress={placeholderData.action}
          accentColor={COLORS_NOTE[headerProps.color?.toLowerCase()] ? headerProps.color : 'accent'}
          accentText="light"
          style={{
            marginTop: 10,
            alignSelf: 'flex-start',
            borderRadius: 100,
            height: 40
          }}
        />
      ) : (
        <ActivityIndicator
          style={{
            height: 35
          }}
          color={COLORS_NOTE[headerProps.color?.toLowerCase()] || colors.accent}
        />
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
