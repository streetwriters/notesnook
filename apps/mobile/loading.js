

import React, {Component} from 'react';
import {
    View,
    Text
  } from 'react-native';


export default class Loading extends Component {
render() {
    return <View
    style={{
      width:"100%",
      height:"100%",
      justifyContent:"center",
      alignItems:'center'
    }}
    >
      <Text>
        Loading Screen
      </Text>
    </View>
}
};