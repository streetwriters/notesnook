import React, {Fragment, useEffect, useState} from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FileViewer from 'react-native-file-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import storage from '../../utils/storage';
import {DDS, getElevation, sleep, ToastEvent} from '../../utils/utils';
import {Button} from '../Button/index';
import BaseDialog from '../Dialog/base-dialog';
import DialogHeader from '../Dialog/dialog-header';
import {Loading} from '../Loading';
import Seperator from '../Seperator';

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
  const [doneText, setDoneText] = useState(null);
  const [result, setResult] = useState({});
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
    setVisible(false);
    setNotes([]);
  };

  const save = async (func, name) => {
    setExporting(true);
    let res;
    for (var i = 0; i < notes.length; i++) {
      let note = notes[i];
      res = await func(note);
      if (!res) {
        setExporting(false);
        return;
      }
    }
    setDoneText(
      `Note exported successfully! You can find the exported note in ${
        Platform.OS === 'ios'
          ? 'Files Manager/Notesnook'
          : `Storage/Notesnook/exported/${name}`
      }.`,
    );

    setResult(res);
    setComplete(true);
  };

  const actions = [
    {
      title: 'PDF',
      func: async () => {
        
        await save(storage.saveToPDF, 'PDF');
      },
      icon: 'file-pdf-box',
    },
    {
      title: 'Markdown',
      func: async () => {
        await save(storage.saveToMarkdown, 'Markdown');
      },
      icon: 'language-markdown',
    },
    {
      title: 'Plain Text',
      func: async () => {
        await save(storage.saveToText, 'Text');
      },
      icon: 'card-text',
    },
    {
      title: 'HTML',
      func: async () => {
        await save(storage.saveToHTML, 'Html');
      },
      icon: 'language-html5',
    },
  ];

  return (
    <BaseDialog onRequestClose={close} visible={visible}>
      <View
        style={[
          {
            width: DDS.isTab ? 350 : '80%',
            backgroundColor: colors.bg,
          },
          styles.container,
        ]}>
        <DialogHeader
          icon="export"
          title="Export Note"
          paragraph={
            exporting
              ? null
              : 'Export your note in any of the following formats.'
          }
        />

        <Seperator half />
        {exporting ? (
          <Loading
            done={complete}
            doneText={doneText}
            onDone={async () => {
              close();
              await sleep(500);
              FileViewer.open(result.filePath, {
                showOpenWithDialog: true,
                showAppsSuggestions: true,
              }).catch((e) => {
                console.log(e);
                ToastEvent.show(
                  `No application found to open ${result.name} file`,
                );
              });
          
            }}
            tagline="Exporting notes"
          />
        ) : (
          <>
            <View style={styles.buttonContainer}>
              {actions.map((item) => (
                <Fragment key={item.title}>
                  <Seperator half />
                  <Button
                    width="100%"
                    title={item.title}
                    icon={item.icon}
                    activeOpacity={opacity}
                    onPress={item.func}
                  />
                </Fragment>
              ))}
            </View>
          </>
        )}
      </View>
    </BaseDialog>
  );
};

const styles = StyleSheet.create({
  container: {
    ...getElevation(5),
    maxHeight: 350,
    borderRadius: 5,
    paddingHorizontal: ph,
    paddingVertical: pv,
  },
  buttonContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
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
