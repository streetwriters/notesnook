import React from 'react';
import {Dimensions, Platform, SafeAreaView, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SIZE, WEIGHT} from '../../common/common';
import {ListItem} from '../../components/ListItem';
import {useTracked} from '../../provider';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Lists = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  return (
    <SafeAreaView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: '5%',
          marginTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.04,
          marginBottom: h * 0.04,
        }}>
        <Text
          style={{
            fontSize: SIZE.xl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
          }}>
          Lists
        </Text>
        <Icon name="md-more" color={colors.icon} size={SIZE.xl} />
      </View>

      <ListItem />
    </SafeAreaView>
  );
};

Lists.navigationOptions = {
  header: null,
};

export default Lists;
