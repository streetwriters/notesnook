import React from 'react';
import {View} from 'react-native';
import * as Progress from 'react-native-progress';
import {useAttachmentStore} from '../../provider/stores';
import {SIZE} from '../../utils/SizeUtils';

export const ProgressCircle = () => {
  const loading = useAttachmentStore(state => state.loading);

  return loading && loading.current !== loading.total ? (
    <View
      style={{
        justifyContent: 'center',
        marginLeft: 10
      }}>
      <Progress.Circle
        size={SIZE.xxl}
        progress={loading.current/loading.total}
        showsText
        textStyle={{
          fontSize: 8
        }}
        color={colors.accent}
        formatText={progress => (progress * 100).toFixed(0)}
        borderWidth={0}
        thickness={2}
      />
    </View>
  ) : null;
};
