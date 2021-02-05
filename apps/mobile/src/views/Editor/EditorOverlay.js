import React, {useEffect, useState} from 'react';
import {ActivityIndicator} from 'react-native';
import {View} from 'react-native';
import {Button} from '../../components/Button';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {SIZE} from '../../utils/SizeUtils';

let timer = null;
let timerError = null;
const EditorOverlay = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const load = (loading) => {
    clearTimeout(timer);
    clearTimeout(timerError);
    if (loading) {
      timer = setTimeout(() => {
        setLoading(loading);
        timerError = setTimeout(() => {
          setError(true);
        }, 6000);
      }, 3000);
    } else {
      setError(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    eSubscribeEvent('loadingNote', load);
    return () => {
      eUnSubscribeEvent('loadingNote', load);
    };
  }, []);

  return (
    loading && (
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.2)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            width: '80%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bg,
            borderRadius: 5,
            paddingVertical: 20,
          }}>
          <ActivityIndicator color={colors.accent} size={SIZE.xxxl} />
          <Paragraph size={SIZE.md}>Loading Note</Paragraph>

          {error && (
            <>
              <Button
                type="error"
                style={{
                  marginTop: 10,
                }}
                onPress={() => {
                  eSendEvent('webviewreset');
                }}
                title="Taking too long? Reload Editor"
              />
              <Paragraph
                textBreakStrategy="balanced"
                size={SIZE.xs}
                color={colors.icon}
                style={{
                  textAlign: 'center',
                  maxWidth: '70%',
                  marginTop: 5,
                }}>
                If the editor fails to load even after reloading. Try restarting
                the app.
              </Paragraph>
            </>
          )}
        </View>
      </View>
    )
  );
};

export default EditorOverlay;
