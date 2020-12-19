import {StyleSheet} from 'react-native';
import { dWidth } from '../../utils';

export const styles = StyleSheet.create({
  scrollview: {
    height: '100%',
    width: dWidth,
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    backgroundColor: 'white',
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  indicator: {
    height: 6,
    width: 45,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    marginVertical: 5,
    marginTop: 0,
    alignSelf: 'center',
  },
  parentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
