import React, {useState} from 'react';
import {View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider/index';
import {
  validateEmail,
  validatePass,
  validateUsername,
} from '../../services/Validation';
import {getElevation} from '../../utils';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
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
}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const [error, setError] = useState(false);
  const [value, setValue] = useState(null);
  const [focus, setFocus] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [showError, setShowError] = useState(false);
  const color = error
    ? colors.red
    : focus
    ? customColor || colors.accent
    : colors.nav;

  const validate = () => {
    if (!validationType) return;
    if (!value || value?.length === 0) {
      setError(false);
      onErrorCheck(false);
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
    console.log('isError', isError, error);
    setError(!isError);
    onErrorCheck(!isError);
  };

  const onChange = (value) => {
    onChangeText(value);
    setValue(value);
    if (error) {
      validate();
    }
  };

  const onBlur = () => {
    setFocus(false);
    validate();
  };

  const onFocus = () => {
    setFocus(true);
  };

  const style = {
    borderBottomWidth: 1,
    borderColor: color,
    paddingHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 50,
    marginBottom: marginBottom,
  };

  const textStyle = {
    paddingHorizontal: 0,
    fontSize: SIZE.md,
    fontFamily: WEIGHT.regular,
    color: colors.pri,
    paddingVertical: 0,
    paddingBottom: 2.5,
    flexGrow: 1,
    height: 35,
  };

  return (
    <>
      <View style={style}>
        <TextInput
          ref={fwdRef}
          testID={testID}
          editable={!loading}
          defaultValue={defaultValue}
          autoCapitalize={autoCapitalize}
          onChangeText={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onSubmitEditing={onSubmit}
          blurOnSubmit={blurOnSubmit}
          style={textStyle}
          secureTextEntry={secureTextEntry && secureEntry}
          placeholder={placeholder}
          placeholderTextColor={colors.icon}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            height: 35,
            alignItems: 'center',
          }}>
          {secureTextEntry && (
            <ActionIcon
              name="eye"
              size={20}
              top={10}
              bottom={10}
              onPress={() => {
                setSecureEntry(!secureEntry);
              }}
              style={{
                width: 25,
                marginLeft: 5,
              }}
              color={secureEntry ? colors.icon : colors.accent}
            />
          )}

          {button && (
            <ActionIcon
              name={button.icon}
              size={20}
              top={10}
              bottom={10}
              onPress={button.onPress}
              style={{
                width: 25,
                marginLeft: 5,
              }}
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
                marginLeft: 5,
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
              top: 0,
            }}>
            <Paragraph
              size={SIZE.xs}
              style={{
                textAlign: 'right',
                textAlignVertical: 'bottom',
              }}>
              <Icon
                name="alert-circle-outline"
                size={SIZE.xs}
                color={colors.errorText}
              />{' '}
              {errorMessage}
            </Paragraph>
          </View>
        ) : null}
      </View>
    </>
  );
};

export default Input;
