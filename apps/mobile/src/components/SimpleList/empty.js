import React from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notesnook } from '../../../e2e/test.ids';
import { useTracked } from '../../provider';
import { COLORS_NOTE } from '../../utils/Colors';
import { normalize, SIZE } from '../../utils/SizeUtils';
import { Button } from '../Button';
import { Placeholder } from '../ListPlaceholders';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const Empty = ({ loading = true, placeholderData, absolute, headerProps, type, screen }) => {
  const [state] = useTracked();
  const { colors } = state;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          position: absolute ? 'absolute' : 'relative',
          zIndex: absolute ? 10 : null,
          height: height - 250 - insets.top,
          width: '100%'
        }
      ]}
    >
      <View
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Placeholder
          color={COLORS_NOTE[headerProps.color?.toLowerCase()] || colors.accent}
          w={normalize(150)}
          h={normalize(150)}
          type={screen === 'Favorites' ? 'favorites' : type}
        />
        <Heading>{placeholderData.heading}</Heading>
        <Paragraph
          textBreakStrategy="balanced"
          style={{
            textAlign: 'center',
            width: '80%'
          }}
          color={colors.icon}
        >
          {loading ? placeholderData.loading : placeholderData.paragraph}
        </Paragraph>
        <Seperator />
        {placeholderData.button && !loading ? (
          <Button
            onPress={placeholderData.action}
            title={placeholderData.button}
            icon={placeholderData.buttonIcon || 'plus'}
            testID={notesnook.buttons.add}
            type="accent"
            fontSize={SIZE.md}
            accentColor="bg"
            accentText={
              COLORS_NOTE[headerProps.color?.toLowerCase()] ? headerProps.color : 'accent'
            }
          />
        ) : loading ? (
          <ActivityIndicator
            style={{
              height: 35
            }}
            color={COLORS_NOTE[headerProps.color?.toLowerCase()] || colors.accent}
          />
        ) : (
          <View
            style={{
              height: 35
            }}
          />
        )}
      </View>
    </View>
  );
};
