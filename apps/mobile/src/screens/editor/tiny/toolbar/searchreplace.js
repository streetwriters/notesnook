import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button } from '../../../../components/ui/button';
import Input from '../../../../components/ui/input';
import { useThemeStore } from '../../../../stores/theme';
import { useEditorStore, useSettingStore } from '../../../../stores/stores';
import { showTooltip, TOOLTIP_POSITIONS } from '../../../../utils';
import { hideAllTooltips } from '../../../../utils/hooks/use-tooltip';
import layoutmanager from '../../../../utils/layout-manager';
import { SIZE } from '../../../../utils/size';
import { EditorWebView, getNote } from '../../Functions';
import tiny from '../tiny';
import { endSearch } from './commands';
import { properties } from './constants';
import { editorController } from '../../tiptap/utils';

const SearcReplace = () => {
  const colors = useThemeStore(state => state.colors);
  const [focusType, setFocusType] = useState(0);
  const [enableReplace, setEnableReplace] = useState(false);
  const [menu, setMenu] = useState(false);
  const deviceMode = useSettingStore(state => state.deviceMode);
  const searchSelection = useEditorStore(state => state.searchSelection);
  const findRef = useRef();
  const [config, setConfig] = useState({
    matchCase: false,
    matchWholeWord: false
  });
  const values = useRef({
    find: null,
    replace: null
  });
  const switchModeRef = useRef();
  const valueChangeTimer = useRef();

  async function searchWithSelection() {
    values.current.find = searchSelection;
    findRef.current?.setNativeProps({
      text: searchSelection
    });
    find();
  }

  useEffect(() => {
    searchWithSelection();
  }, [searchSelection]);

  function find() {
    if (!values.current?.find) return;
    tiny.call(
      EditorWebView,
      `tinymce.activeEditor.plugins.searchreplace.find("${values.current?.find}",${config.matchCase},${config.matchWholeWord})`
    );
  }

  useEffect(() => {
    find();
  }, [config.matchCase, config.matchWholeWord]);

  function replace(all = false) {
    if (!values.current?.replace) return;
    tiny.call(
      EditorWebView,
      `tinymce.activeEditor.undoManager.transact(function () {
          tinymce.activeEditor.plugins.searchreplace.replace("${values.current?.replace}",true${
        all ? ',true' : ''
      });
      setTimeout(function() {
        tinyMCE.activeEditor.fire("input",{data:""})
      },300)

        });`
    );
  }

  function next() {
    tiny.call(EditorWebView, `tinymce.activeEditor.plugins.searchreplace.next()`);
  }

  function prev() {
    tiny.call(EditorWebView, `tinymce.activeEditor.plugins.searchreplace.prev()`);
  }

  function done() {
    endSearch();
  }

  function toggleMatchCase() {
    setConfig(c => {
      c.matchCase = !c.matchCase;
      return { ...c };
    });
  }

  function toggleMatchWholeWord() {
    setConfig(c => {
      c.matchWholeWord = !c.matchWholeWord;
      return { ...c };
    });
  }

  const menuButtons = [
    {
      icon: 'chevron-left',
      type: 'gray',
      press: () => {
        layoutmanager.withAnimation(150);
        setMenu(false);
      },
      fullname: 'Go back'
    },
    {
      icon: 'format-letter-case',
      type: 'gray',
      press: toggleMatchCase,
      on: config.matchCase,
      fullname: 'Match case'
    },
    {
      icon: 'format-letter-matches',
      type: 'gray',
      press: toggleMatchWholeWord,
      on: config.matchWholeWord,
      fullname: 'Match whole word'
    }
  ];

  const searchButtons = menu
    ? menuButtons
    : [
        {
          icon: 'arrow-up',
          type: 'gray',
          press: prev,
          fullname: 'Previous'
        },
        {
          icon: 'arrow-down',
          type: 'gray',
          press: next,
          fullname: 'Next'
        },
        {
          icon: 'close',
          type: 'gray',
          press: done,
          fullname: 'End search'
        },
        {
          icon: 'dots-vertical',
          type: 'gray',
          press: () => {
            layoutmanager.withAnimation(150);
            setMenu(true);
          },
          fullname: 'Show options'
        }
      ];

  const replaceButtons = [
    {
      text: 'Replace',
      type: 'grayBg',
      press: () => replace()
    },
    {
      text: 'Replace all',
      type: 'gray',
      press: () => replace(true)
    }
  ];

  return (
    <View
      style={{
        width: '100%',
        backgroundColor: colors.bg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        paddingLeft: 0,
        paddingBottom: 0,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      <Button
        height="93%"
        iconSize={SIZE.md + 4}
        icon={enableReplace ? 'chevron-down' : 'find-replace'}
        style={{
          paddingHorizontal: 3,
          marginBottom: 10
        }}
        fwdRef={switchModeRef}
        iconColor={enableReplace ? colors.accent : colors.icon}
        onPress={() => {
          if (editorController.current?.note?.readonly) return;
          hideAllTooltips();
          if (enableReplace) {
            if (focusType === 2) {
              findRef.current?.focus();
            }
            setEnableReplace(false);
          } else {
            setEnableReplace(true);
          }
        }}
      />

      <View
        style={{
          flexGrow: 1,
          flexDirection: deviceMode !== 'mobile' ? 'row' : 'column',
          flexShrink: 1
        }}
      >
        <Input
          fwdRef={findRef}
          onChangeText={value => {
            values.current.find = value;
            valueChangeTimer.current && clearTimeout(valueChangeTimer.current);
            valueChangeTimer.current = setTimeout(() => {
              find();
            }, 300);
          }}
          defaultValue={values.current?.find || properties.selection?.current?.value}
          onFocusInput={() => setFocusType(1)}
          onSubmit={find}
          blurOnSubmit={false}
          returnKeyType="search"
          returnKeyLabel="Search"
          buttons={
            <>
              {searchButtons.map(button => (
                <Button
                  key={button.text}
                  title={button.text}
                  fontSize={SIZE.xs}
                  height={28}
                  onLongPress={event => {
                    console.log(event);
                    showTooltip(event, button.fullname, TOOLTIP_POSITIONS.TOP);
                  }}
                  iconSize={SIZE.md + 4}
                  width={null}
                  style={{
                    paddingHorizontal: button.icon ? 6 : 10
                  }}
                  iconColor={button.on ? colors.accent : null}
                  buttonType={{
                    text: button.text && colors.accent
                  }}
                  onPress={button.press}
                  icon={button.icon}
                  type={button.type}
                />
              ))}
            </>
          }
          placeholder={'Find'}
          fontSize={SIZE.xs + 1}
          height={40}
          marginRight={deviceMode !== 'mobile' ? 10 : 0}
        />

        {enableReplace ? (
          <>
            <Input
              onSubmit={replace}
              onChangeText={value => {
                values.current.replace = value;
              }}
              defaultValue={values.current?.replace}
              blurOnSubmit={false}
              buttons={
                <>
                  {replaceButtons.map(button => (
                    <Button
                      key={button.text}
                      title={button.text}
                      fontSize={SIZE.xs + 1}
                      height={28}
                      width={null}
                      buttonType={{
                        text: colors.accent
                      }}
                      onPress={button.press}
                      style={{
                        paddingHorizontal: button.icon ? 6 : 12
                      }}
                      icon={button.icon}
                      type={button.type}
                    />
                  ))}
                </>
              }
              placeholder={'Replace with'}
              fontSize={SIZE.xs + 1}
              onFocusInput={() => setFocusType(2)}
              height={40}
            />
          </>
        ) : null}
      </View>
    </View>
  );
};

export default SearcReplace;
