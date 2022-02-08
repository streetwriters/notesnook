import React from 'react';
import { ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { BUTTON_TYPES, showTooltip } from '../../utils';
import { SIZE } from '../../utils/SizeUtils';
import { PressableButton } from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

/**
 *
 * @param {import('../PressableButton').buttonTypes} type
 */
export const Button = ({
  height = 45,
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
  hitSlop,
  buttonType = {},
  bold,
  iconColor
}) => {
  const [state] = useTracked();
  const { colors } = state;

  const textColor = buttonType.text
    ? buttonType.text
    : colors[
        type === 'accent'
          ? BUTTON_TYPES[type](accentColor, accentText).text
          : BUTTON_TYPES[type].text
      ];
  const Component = bold ? Heading : Paragraph;

  return (
    <PressableButton
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={event => {
        if (onLongPress) {
          onLongPress(event);
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
      customColor={buttonType.color}
      customSelectedColor={buttonType.selected}
      customOpacity={buttonType.opacity}
      customAlpha={buttonType.alpha}
      customStyle={{
        height: height,
        width: width || null,
        paddingHorizontal: 12,
        borderRadius: 5,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        ...style
      }}
    >
      {loading ? <ActivityIndicator color={textColor} size={fontSize + 4} /> : null}
      {icon && !loading && iconPosition === 'left' ? (
        <Icon
          name={icon}
          style={{
            marginRight: 0
          }}
          color={iconColor || buttonType.text || textColor}
          size={iconSize}
        />
      ) : null}

      {!title ? null : (
        <Component
          color={textColor}
          size={fontSize}
          numberOfLines={1}
          style={[
            {
              marginLeft: icon || (loading && iconPosition === 'left') ? 5 : 0,
              marginRight: icon || (loading && iconPosition === 'right') ? 5 : 0
            },
            textStyle
          ]}
        >
          {title}
        </Component>
      )}

      {icon && !loading && iconPosition === 'right' ? (
        <Icon
          name={icon}
          style={{
            marginLeft: 0
          }}
          color={iconColor || buttonType.text || textColor}
          size={iconSize}
        />
      ) : null}
    </PressableButton>
  );
};
