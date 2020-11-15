import React, {Fragment, useEffect, useState} from 'react';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
import FileViewer from 'react-native-file-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import Exporter from '../../services/Exporter';
import PremiumService from '../../services/PremiumService';
import {getElevation} from '../../utils';
import {ph, pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {GetPremium} from '../ActionSheetComponent/GetPremium';
import {Button} from '../Button/index';
import BaseDialog from '../Dialog/base-dialog';
import DialogHeader from '../Dialog/dialog-header';
import {Loading} from '../Loading';
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
        await PremiumService.verify(
          async () => {
            await save(Exporter.saveToPDF, 'PDF');
          },
          () => {
            eSendEvent(eShowGetPremium, {
              context: 'export',
              title: 'Export in PDF, MD & HTML',
              desc:
                'Get Notesnook Pro to export your notes in PDF, Markdown and HTML formats!',
            });
          },
        );
      },
      icon: 'file-pdf-box',
      desc: 'Most commonly used, opens on any device.',
    },
    {
      title: 'Markdown',
      func: async () => {
        await PremiumService.verify(
          async () => {
            await save(Exporter.saveToMarkdown, 'Markdown');
          },
          () => {
            eSendEvent(eShowGetPremium, {
              context: 'export',
              title: 'Export in PDF, MD & HTML',
              desc:
                'Get Notesnook Pro to export your notes in PDF, Markdown and HTML formats!',
            });
          },
        );
      },
      icon: 'language-markdown',
      desc: 'Most commonly used, opens on any device.',
    },
    {
      title: 'Plain Text',
      func: async () => {
        await save(Exporter.saveToText, 'Text');
      },
      icon: 'card-text',
      desc: 'A plain text file with no formatting.',
    },
    {
      title: 'HTML',
      func: async () => {
        await PremiumService.verify(
          async () => {
            await save(Exporter.saveToHTML, 'Html');
          },
          () => {
            eSendEvent(eShowGetPremium, {
              context: 'export',
              title: 'Export in PDF, MD & HTML',
              desc:
                'Get Notesnook Pro to export your notes in PDF, Markdown and HTML formats!',
            });
          },
        );
      },
      icon: 'language-html5',
      desc: 'A file that can be opened in a browser.',
    },
  ];

  return (
    <BaseDialog
      premium={<GetPremium context="export" offset={50} close={close} />}
      onRequestClose={close}
      visible={visible}>
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

                  <TouchableOpacity
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
                    <Heading
                      style={{marginLeft: 5, maxWidth: '90%'}}
                      size={SIZE.md}>
                      {item.title}
                      {'\n'}
                      <Paragraph size={SIZE.sm} color={colors.icon}>
                        {item.desc}
                      </Paragraph>
                    </Heading>
                  </TouchableOpacity>
                </Fragment>
              ))}
              <Seperator />
              <View
                style={{
                  justifyContent: 'flex-end',
                  width: '100%',
                  flexDirection: 'row',
                }}>
                <View />
                <Button
                  onPress={close}
                  width="30%"
                  type="gray"
                  title="Cancel"
                  fontSize={SIZE.md}
                />
              </View>
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
