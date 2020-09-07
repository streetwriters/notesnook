import React, {useEffect, useState} from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {DDS, getElevation, db} from '../../utils/utils';
import {Loading} from '../Loading';
const {
  eSubscribeEvent,
  eUnSubscribeEvent,
} = require('../../services/eventManager');
const {
  eOpenExportDialog,
  eCloseExportDialog,
} = require('../../services/events');

const ExportDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors, tags, premiumUser} = state;
  const [visible, setVisible] = useState(false);
  const [notes, setNotes] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    eSubscribeEvent(eOpenExportDialog, open);
    eSubscribeEvent(eCloseExportDialog, close);

    return () => {
      eUnSubscribeEvent(eOpenExportDialog, open);
      eUnSubscribeEvent(eCloseExportDialog, close);
    };
  }, []);

  const open = (data) => {
    setVisible(true);
    setNotes(data);
  };

  const close = (data) => {

    
    setComplete(false);
    setExporting(false);
    setNotes([]);
    setVisible(false);
    setNotes(data);
  };

  const actions = [
    {
      title: 'PDF',
      func: () => {},
      icon: 'file-pdf-box',
    },
    {
      title: 'Markdown',
      func: () => {},
      icon: 'language-markdown',
    },
    {
      title: 'Plain Text',
      func: () => {},
      icon: 'card-text',
    },
    {
      title: 'HTML',
      func: () => {},
      icon: 'language-html5',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animated
      animationType="fade"
      onRequestClose={close}>
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={close} style={styles.overlay} />
        <View
          style={[
            {
              width: DDS.isTab ? '40%' : '80%',
              backgroundColor: colors.bg,
            },
            styles.container,
          ]}>
          <View style={styles.headingContainer}>
            <Icon name="export" color={colors.accent} size={SIZE.lg} />
            <Text style={[{color: colors.accent}, styles.heading]}>
              Export
              {notes.length === 0 || notes.length === 1
                ? ''
                : ' ' + notes.length}{' '}
              Note
            </Text>
          </View>

          {exporting ? (
            <Loading
              done={complete}
              doneText={`Note exported successfully! You can find exported notes in ${
                Platform.OS === 'ios'
                  ? 'Files Manager/Notesnook'
                  : 'Phone Storage/Notesnook/Exported/'
              }.`}
              onDone={close}
              tagline="Exporting notes..."
            />
          ) : (
            <View style={styles.buttonContainer}>
              {actions.map((item) => (
                <TouchableOpacity
                  activeOpacity={opacity}
                  onPress={() => {
                    setExporting(true);
                    setTimeout(() => {
                      setComplete(true);
                    }, 1000);
                  }}
                  style={[
                    styles.button,
                    {
                      borderColor: colors.accent,
                      backgroundColor: colors.accent,
                    },
                  ]}>
                  <Icon name={item.icon} color="white" size={SIZE.lg} />
                  <Text style={styles.buttonText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    ...getElevation(5),
    maxHeight: 350,
    borderRadius: 5,
    paddingHorizontal: ph,
    paddingVertical: pv,
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontFamily: WEIGHT.bold,
    marginLeft: 5,
    fontSize: SIZE.md,
  },
  button: {
    paddingVertical: pv,
    paddingHorizontal: ph,
    marginTop: 10,
    borderRadius: 5,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: WEIGHT.medium,
    color: 'white',
    fontSize: SIZE.sm,
    marginLeft: 5,
  },
  overlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});

export default ExportDialog;
