
import React, {Fragment,useEffect,useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from 'react-native';
import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Loading from "../../../loading";
import { COLOR_SCHEME } from '../../common/common';


export const Home = ({navigation}) => {
 
    const [loading,setLoading] = useState(true);
    const [colors,setColors] = useState(COLOR_SCHEME);
    
  

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      
    },1000)
  })
  
   return loading? <Loading/> :<>
    <Text>Hello</Text>
    
  </>
  };

  Home.navigationOptions = {
    header: null
  };  


const styles = StyleSheet.create({

});

export default Home;

