import React,{useState} from 'react';
import NavigationService, {AppContainer} from "./src/services/NavigationService"

const App = () => {
  return (<AppContainer
    ref={navigatorRef => {
      NavigationService.setTopLevelNavigator(navigatorRef);
    }}
  />
  );
};

export default App;
