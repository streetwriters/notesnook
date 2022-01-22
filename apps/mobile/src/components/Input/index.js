import React, { useState } from 'react';
import { TouchableOpacity, TextInput } from 'react-native';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider/index';
import {
  ERRORS_LIST,
  validateEmail,
  validatePass,
  validateUsername
} from '../../services/Validation';
import { getElevation } from '../../utils';
import { SIZE } from '../../utils/SizeUtils';
import { ActionIcon } from '../ActionIcon';
import Paragraph from '../Typography/Paragraph';

const Input = ({
  fwdRef,
  validationType,
  loading,
  autoCapitalize,
  onChangeText,
  onSubmit,
  blurOnSubmit,
  placeholder,
  onErrorCheck,
  errorMessage,
  secureTextEntry,
  customColor,
  customValidator,
  marginBottom = 10,
  button,
  testID,
  defaultValue,
  clearTextOnFocus,
  onBlurInput,
  onPress,
  height = 50,
  fontSize = SIZE.md,
  returnKeyType,
  returnKeyLabel,
  autoCompleteType,
  onFocusInput,
  buttons,
  marginRight,
  autoCorrect = true,
  buttonLeft
}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const [error, setError] = useState(false);
  const [focus, setFocus] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorList, setErrorList] = useState({
    SHORT_PASS: true
    //  NO_ABC: true,
    //  NO_CAPS_ABC: true,
    //  NO_NUM: true,
    //  SPECIAL: true,
  });

  const color = error ? colors.red : focus ? customColor || colors.accent : colors.nav;

  const validate = value => {
    if (!validationType) return;
    if (!value || value?.length === 0) {
      setError(false);
      onErrorCheck(false);
      setErrorList({
        SHORT_PASS: true,
        NO_ABC: true,
        NO_CAPS_ABC: true,
        NO_NUM: true,
        SPECIAL: true
      });
      return;
    }
    let isError = false;
    switch (validationType) {
      case 'password':
        isError = validatePass(value);
        break;
      case 'email':
        isError = validateEmail(value);
        break;
      case 'username':
        isError = validateUsername(value);
        break;
      case 'confirmPassword':
        isError = value === customValidator();
        break;
    }

    if (validationType === 'password') {
      let hasError = false;

      Object.keys(isError).forEach(e => {
        if (isError[e] === true) {
          hasError = true;
        }
      });
      setError(hasError);
      onErrorCheck(hasError);
      setErrorList(isError);
    } else {
      setError(!isError);
      onErrorCheck(!isError);
    }
  };

  const onChange = value => {
    onChangeText(value);
    validate(value);
  };

  const onBlur = () => {
    setFocus(false);
    if (onBlurInput) {
      onBlurInput();
    }
  };

  const onFocus = () => {
    setFocus(true);
    if (onFocusInput) {
      onFocusInput();
    }
  };

  const style = {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: color,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexGrow: 1,
    height: height || 50,
    paddingHorizontal: 12,
    paddingRight: buttons || button || secureTextEntry || error ? 6 : 12
  };

  const textStyle = {
    paddingHorizontal: 0,
    fontSize: fontSize,
    color: onPress && loading ? colors.accent : colors.pri,
    paddingVertical: 0,
    paddingBottom: 2.5,
    flexGrow: 1,
    height: height || 50,
    fontFamily: 'OpenSans-Regular'
  };

  return (
    <>
      <View
        importantForAccessibility="yes"
        style={{
          height: height,
          marginBottom: marginBottom,
          flexGrow: 1,
          maxHeight: height,
          marginRight: marginRight
        }}
      >
        <TouchableOpacity disabled={!loading} onPress={onPress} activeOpacity={1} style={style}>
          {buttonLeft && buttonLeft}

          <TextInput
            ref={fwdRef}
            testID={testID}
            editable={!loading}
            defaultValue={defaultValue}
            autoCapitalize={autoCapitalize}
            onChangeText={onChange}
            autoCorrect={autoCorrect}
            onBlur={onBlur}
            keyboardType={validationType === 'email' ? 'email-address' : 'default'}
            importantForAutofill="yes"
            importantForAccessibility="yes"
            returnKeyLabel={returnKeyLabel}
            returnKeyType={returnKeyType}
            keyboardAppearance={colors.night ? 'dark' : 'light'}
            onFocus={onFocus}
            onSubmitEditing={onSubmit}
            blurOnSubmit={blurOnSubmit}
            style={textStyle}
            secureTextEntry={secureTextEntry && secureEntry}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            autoCompleteType={autoCompleteType}
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              height: 35 > height ? height : 35,
              alignItems: 'center'
            }}
          >
            {secureTextEntry && (
              <ActionIcon
                name="eye"
                size={20}
                top={10}
                bottom={10}
                onPress={() => {
                  fwdRef?.current?.blur();
                  setSecureEntry(!secureEntry);
                }}
                style={{
                  width: 25,
                  marginLeft: 5
                }}
                color={secureEntry ? colors.icon : colors.accent}
              />
            )}

            {buttons}

            {button && (
              <ActionIcon
                name={button.icon}
                size={SIZE.xl}
                top={10}
                bottom={10}
                onPress={button.onPress}
                color={button.color}
              />
            )}

            {error && (
              <ActionIcon
                name="alert-circle-outline"
                top={10}
                bottom={10}
                onPress={() => {
                  setShowError(!showError);
                }}
                size={20}
                style={{
                  width: 25,
                  marginLeft: 5
                }}
                color={colors.errorText}
              />
            )}
          </View>

          {error && showError && errorMessage ? (
            <View
              style={{
                position: 'absolute',
                backgroundColor: colors.nav,
                paddingVertical: 3,
                paddingHorizontal: 5,
                borderRadius: 2.5,
                ...getElevation(2),
                top: 0
              }}
            >
              <Paragraph
                size={SIZE.xs}
                style={{
                  textAlign: 'right',
                  textAlignVertical: 'bottom'
                }}
              >
                <Icon name="alert-circle-outline" size={SIZE.xs} color={colors.errorText} />{' '}
                {errorMessage}
              </Paragraph>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {validationType === 'password' && focus && (
        <View
          style={{
            paddingTop: 5
          }}
        >
          {Object.keys(errorList).filter(k => errorList[k] === true).length !== 0 ? (
            Object.keys(ERRORS_LIST).map(error => (
              <View
                key={ERRORS_LIST[error]}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Icon
                  name={errorList[error] ? 'close' : 'check'}
                  color={errorList[error] ? 'red' : 'green'}
                />

                <Paragraph style={{ marginLeft: 5 }} size={SIZE.xs}>
                  {ERRORS_LIST[error]}
                </Paragraph>
              </View>
            ))
          ) : (
            <Paragraph color={colors.green} size={SIZE.xs}>
              Password is strong.
            </Paragraph>
          )}
        </View>
      )}
    </>
  );
};

export default Input;
