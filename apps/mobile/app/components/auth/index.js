import React, { useState } from "react";
import { View } from "react-native";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import { Toast } from "../toast";
import { initialAuthMode } from "./common";
import { Login } from "./login";
import { Signup } from "./signup";

export const AuthMode = {
  login: 0,
  signup: 1,
  welcomeSignup: 2,
  trialSignup: 3
};

const Auth = ({ navigation, route }) => {
  const [currentAuthMode, setCurrentAuthMode] = useState(
    route?.params?.mode || AuthMode.login
  );
  initialAuthMode.current = route?.params.mode || AuthMode.login;
  useNavigationFocus(navigation, {
    onFocus: () => {
      //tabBarRef?.current.lock();
      initialAuthMode.current = route?.params.mode || AuthMode.login;
    }
  });

  return (
    <View style={{ flex: 1 }}>
      {currentAuthMode !== AuthMode.login ? (
        <Signup
          changeMode={(mode) => setCurrentAuthMode(mode)}
          trial={AuthMode.trialSignup === currentAuthMode}
          welcome={initialAuthMode.current === AuthMode.welcomeSignup}
        />
      ) : (
        <Login
          welcome={initialAuthMode.current}
          changeMode={(mode) => setCurrentAuthMode(mode)}
        />
      )}

      {/* {initialAuthMode.current === AuthMode.welcomeSignup ? null : (
        <IconButton
          name="arrow-left"
          onPress={() => {
            hideAuth();
          }}
          color={colors.pri}
          customStyle={{
            position: 'absolute',
            zIndex: 999,
            left: 12,
            top: Platform.OS === 'ios' ? 12 + insets.top : insets.top
          }}
        />
      )} */}

      <Toast context="local" />
    </View>
  );
};

export default Auth;
