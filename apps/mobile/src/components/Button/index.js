import React from 'react';
import {ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {BUTTON_TYPES, showTooltip} from '../../utils';
import {ph, pv, SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

/**
 *
 * @param {import('../PressableButton').buttonTypes} type
 */
export const Button = ({
  height = 40,
  width = null,
  onPress = () => {},
  loading = false,
  title = null,
  icon,
  fontSize = SIZE.sm,
  type = 'transparent',
  iconSize = SIZE.md,
  style = {},
  testID,
  accentColor = 'accent',
  accentText = 'light',
  onLongPress,
  tooltipText,
  textStyle,
  iconPosition = 'left',
  hitSlop
}) => {
  const [state] = useTracked();
  const {colors} = state;
  const textColor =
    colors[
      type === 'accent'
        ? BUTTON_TYPES[type](accentColor, accentText).text
        : BUTTON_TYPES[type].text
    ];

  return (
    <PressableButton
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={event => {
        if (onLongPress) {
          onLongPress();
          return;
        }
        if (tooltipText) {
          showTooltip(event, tooltipText);
        }
      }}
      disabled={loading}
      testID={testID}
      type={type}
      accentColor={accentColor}
      accentText={accentText}
      customStyle={{
        height: height,
        width: width || null,
        paddingHorizontal: ph,
        borderRadius: 5,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        ...style,
      }}>
      {loading && <ActivityIndicator color={textColor} />}
      {icon && !loading && iconPosition === 'left' ? (
        <Icon
          name={icon}
          style={{
            marginRight: 0,
          }}
          color={textColor}
          size={iconSize}
        />
      ): null}

      {!title ? null : (
        <Paragraph
          color={textColor}
          size={fontSize}
          numberOfLines={1}
          style={[
            {
              marginLeft: icon || loading && iconPosition === "left" ? 5 : 0,
              marginRight: icon || loading && iconPosition === "right" ? 5 : 0,
            },
            textStyle,
          ]}>
          {title}
        </Paragraph>
      )}

      {icon && !loading && iconPosition === 'right' ? (
        <Icon
          name={icon}
          style={{
            marginLeft: 0,
          }}
          color={textColor}
          size={iconSize}
        />
      ) : null}
    </PressableButton>
  );
};
