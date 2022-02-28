import React, { createRef, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Menu, { MenuItem } from 'react-native-reanimated-material-menu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SheetWrapper from '../../components/ui/sheet';
import { Button } from '../../components/ui/button';
import BaseDialog from '../../components/dialog/base-dialog';
import DialogButtons from '../../components/dialog/dialog-buttons';
import DialogContainer from '../../components/dialog/dialog-container';
import DialogHeader from '../../components/dialog/dialog-header';
import Input from '../../components/ui/input';
import { PressableButton } from '../../components/ui/pressable';
import Seperator from '../../components/ui/seperator';
import Paragraph from '../../components/ui/typography/paragraph';
import { useTracked } from '../../provider';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { EditorWebView, getNote } from './Functions';
import tiny from './tiny/tiny';
import ToggleSwitch from 'toggle-switch-react-native';

export const EditorSettings = () => {
  const [state, dispatch] = useTracked();
  const { colors } = state;
  const [settings, setSettings] = useState({
    fontSize: 10,
    directionality: 'ltr'
  });
  const [visible, setVisible] = useState(false);
  const [savePreset, setSavePreset] = useState(false);
  const actionSheetRef = useRef();

  const open = async () => {
    setVisible(true);
    await sleep(1);
    actionSheetRef.current?.setModalVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const onSettingsRecieved = settings => {
    setSettings(settings);
  };

  useEffect(() => {
    eSubscribeEvent('editorSettingsEvent', onSettingsRecieved);
    eSubscribeEvent('openEditorSettings', open);
    eSubscribeEvent('closeEditorSettings', close);
    return () => {
      eUnSubscribeEvent('editorSettingsEvent', onSettingsRecieved);
      eUnSubscribeEvent('openEditorSettings', open);
      eUnSubscribeEvent('closeEditorSettings', close);
    };
  }, []);

  const SettingsButton = ({
    title,
    description,
    enabled,
    type,
    items,
    dropdownItemPress,
    dropDownTitle,
    style,
    stub,
    onPress
  }) => (
    <PressableButton
      onPress={onPress}
      customStyle={{
        flexDirection: 'row',
        width: '100%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 0,
        paddingHorizontal: 12
      }}
    >
      <View
        style={{
          flexGrow: 1
        }}
      >
        <Paragraph size={SIZE.md}>{title}</Paragraph>
        {description && (
          <Paragraph color={colors.icon} size={SIZE.sm}>
            {description}
          </Paragraph>
        )}
      </View>
      {type === 'dropdown' ? (
        <DropDownMenu
          onPress={dropdownItemPress}
          style={style}
          stub={stub}
          title={dropDownTitle}
          items={items}
        />
      ) : (
        <ToggleSwitch
          isOn={enabled}
          onColor={colors.accent}
          offColor={colors.icon}
          size="small"
          animationSpeed={150}
          onToggle={onPress}
        />
      )}
    </PressableButton>
  );

  let settingsItems = [
    {
      title: 'Font size',
      id: 'fontSize',
      type: 'dropdown',
      items: [10, 12, 14, 16, 18],
      stub: 'pt',
      dropDownTitle: settings.fontSize + 'pt',
      style: {
        width: 70
      },
      dropdownItemPress: item => {
        tiny.call(
          EditorWebView,
          `
        changeFontSize(${item})
        `
        );
      }
    },
    {
      title: 'RTL Direction',
      id: 'rtlDirection',
      type: 'boolean',
      enabled: settings.directionality === 'rtl',
      onPress: async () => {
        tiny.call(
          EditorWebView,
          `
          changeDirection(${settings.directionality === 'rtl' ? false : true})
        `
        );
        eSendEvent('loadingNote', getNote());
        await sleep(100);
        EditorWebView.current?.reload();
      }
    }
  ];

  let presets = [
    {
      name: 'Poems',
      size: '12pt',
      fontname: { name: 'Times New Roman', value: 'times new roman' },
      line_break: 'paragraph',
      direction: 'ltr',
      forecolor: '#ff0000',
      hilitecolor: '#00ff00'
    }
  ];

  return (
    visible && (
      <SheetWrapper
        fwdRef={actionSheetRef}
        onClose={() => {
          setVisible(false);
        }}
      >
        <View>
          {savePreset && (
            <BaseDialog
              onRequestClose={() => {
                setSavePreset(false);
              }}
              visible={true}
            >
              <DialogContainer>
                <DialogHeader title="Save preset" paragraph="Give this preset a name." />
                <Input placeholder="Preset name" />
                <DialogButtons
                  positiveTitle="Save"
                  onPressPositive={() => {}}
                  negativeTitle="Cancel"
                />
              </DialogContainer>
            </BaseDialog>
          )}

          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            <DialogHeader
              title="Editor settings"
              paragraph="Modify editor settings based on personal preference."
              /*  button={{
                title: 'Save as Preset',
                onPress: () => {
                  setSavePreset(true);
                },
              }} */
            />
          </View>

          <Seperator />
          {settingsItems.map(item => (
            <SettingsButton key={item.title} {...item} />
          ))}
        </View>
      </SheetWrapper>
    )
  );
};

const DropDownMenu = ({ items, onPress, style, title, stub }) => {
  const [state, dispatch] = useTracked();
  const { colors } = state;
  const menuRef = useRef();

  return (
    <Menu
      ref={menuRef}
      animationDuration={200}
      style={[
        {
          borderRadius: 5
        },
        style
      ]}
      button={
        <Button
          title={title}
          iconPosition="right"
          icon="chevron-down"
          iconSize={SIZE.lg}
          style={{
            paddingRight: 0
          }}
          onPress={() => {
            menuRef.current?.show();
          }}
          textStyle={{
            fontWeight: 'normal'
          }}
          width={null}
          fontSize={SIZE.sm}
        />
      }
    >
      {items.map((item, index) => (
        <MenuItem
          key={item.toString()}
          onPress={() => {
            onPress(item);
            menuRef.current?.hide();
          }}
          textStyle={{
            fontSize: SIZE.md,
            color: colors.pri
          }}
        >
          <Icon name={item.icon} size={SIZE.md} />
          {item + stub}
        </MenuItem>
      ))}
    </Menu>
  );
};
