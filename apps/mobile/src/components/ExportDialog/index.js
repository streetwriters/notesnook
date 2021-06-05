import React, {Fragment, useEffect, useState} from 'react';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
import FileViewer from 'react-native-file-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {ToastEvent} from '../../services/EventManager';
import Exporter from '../../services/Exporter';
import {getElevation} from '../../utils';
import {ph, pv, SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {GetPremium} from '../ActionSheetComponent/GetPremium';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogHeader from '../Dialog/dialog-header';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const {
  eSubscribeEvent,
  eUnSubscribeEvent,
} = require('../../services/EventManager');
const {
  eOpenExportDialog,
  eCloseExportDialog,
  eShowGetPremium,
} = require('../../utils/Events');

const ExportDialog = () => {
  const [state] = useTracked();
  const {colors} = state;
  
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
    if (exporting) return;
    setExporting(true);
    setComplete(false);
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
    setExporting(false);
    setComplete(true);
  };

  const actions = [
    {
      title: 'PDF',
      func: async () => {
        await save(Exporter.saveToPDF, 'PDF');
      },
      icon: 'file-pdf-box',
      desc:
        'Can be opened in any pdf reader like Adobe Acrobat or Foxit Reader',
      id: notesnook.ids.dialogs.export.pdf,
    },
    {
      title: 'Markdown',
      func: async () => {
        await save(Exporter.saveToMarkdown, 'Markdown');
      },
      icon: 'language-markdown',
      desc: 'Can be opened in any plain-text or markdown editor',
      id: notesnook.ids.dialogs.export.md,
    },
    {
      title: 'Plain Text',
      func: async () => {
        await save(Exporter.saveToText, 'Text');
      },
      icon: 'card-text',
      desc: 'Can be opened in any plain text editor',
      id: notesnook.ids.dialogs.export.text,
    },
    {
      title: 'HTML',
      func: async () => {
        await save(Exporter.saveToHTML, 'Html');
      },
      icon: 'language-html5',
      desc: 'Can be opened in any web browser like Google Chrome.',
      id: notesnook.ids.dialogs.export.html,
    },
  ];

  return !visible ? null : (
    <BaseDialog
      premium={<GetPremium context="export" offset={50} close={close} />}
      onRequestClose={close}
      visible={true}>
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
              : 'All exports are saved in Notesnook/exported folder in phone storage'
          }
        />

        <Seperator half />
        <View style={styles.buttonContainer}>
          {actions.map((item) => (
            <Fragment key={item.title}>
              <Seperator half />
              <TouchableOpacity
                testID={item.id}
                onPress={item.func}
                activeOpacity={1}
                style={{
                  width: '100%',
                  alignItems: 'center',
                  flexDirection: 'row',
                  paddingRight: 12,
                  paddingVertical: 10,
                }}>
                <View
                  style={{
                    backgroundColor: colors.shade,
                    borderRadius: 5,
                    height: 40,
                    width: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Icon
                    name={item.icon}
                    color={colors.accent}
                    size={SIZE.xxxl}
                  />
                </View>
                <View>
                  <Heading
                    style={{marginLeft: 5, maxWidth: '90%'}}
                    size={SIZE.md}>
                    {item.title}
                  </Heading>
                  <Paragraph
                    style={{marginLeft: 5, maxWidth: '90%'}}
                    size={SIZE.sm}
                    color={colors.icon}>
                    {item.desc}
                  </Paragraph>
                </View>
              </TouchableOpacity>
            </Fragment>
          ))}

          <View
            style={{
              width: '100%',
            }}>
            <DialogButtons
              onPressNegative={close}
              negativeTitle="Cancel"
              positiveTitle={complete && 'Open file'}
              onPressPositive={
                complete
                  ? async () => {
                      close();
                      await sleep(500);
                      FileViewer.open(result.filePath, {
                        showOpenWithDialog: true,
                        showAppsSuggestions: true,
                      }).catch((e) => {
                        ToastEvent.show({
                          heading: 'Cannot open',
                          message: `No application found to open ${result.name} file.`,
                          type: 'success',
                          context: 'local',
                        });
                      });
                    }
                  : null
              }
              loading={exporting && !complete}
              doneText={complete && 'Exported as ' + result.name}
            />
          </View>
        </View>
      </View>
    </BaseDialog>
  );
};

const styles = StyleSheet.create({
  container: {
    ...getElevation(5),
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
    //fontFamily: "sans-serif",
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
