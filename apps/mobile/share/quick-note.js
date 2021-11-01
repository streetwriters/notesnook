import React, {Component} from 'react';
import {Appearance, SafeAreaView} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import NotesnookShare from './index';
import {COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT} from '../src/utils/Colors';

export default class QuickNoteIOS extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      colors:
        Appearance.getColorScheme() === 'dark'
          ? COLOR_SCHEME_DARK
          : COLOR_SCHEME_LIGHT,
      height: 0
    };
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  render() {
    return (
      <SafeAreaView
        style={{
          width: '100%',
          height: '100%',
          justifyContent: 'flex-start',
          backgroundColor: this.state.colors.nav
        }}>
        <NotesnookShare quicknote={true} />
      </SafeAreaView>
    );
  }
}
