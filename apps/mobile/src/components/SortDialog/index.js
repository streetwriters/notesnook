import React, {createRef} from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {Actions} from '../../provider/Actions';
import {defaultState} from '../../provider/DefaultState';
import { useNoteStore } from '../../provider/stores';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import SettingsService from '../../services/SettingsService';
import {getElevation, SORT, sortSettings} from '../../utils';
import {eCloseSortDialog, eOpenSortDialog} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {updateEvent} from '../DialogManager/recievers';
import {PressableButton} from '../PressableButton';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';

const actionSheet = createRef();

class SortDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        showToolbarOnTop: false,
        showKeyboardOnOpen: false,
        fontScale: 1,
        forcePortraitOnTablet: false,
        useSystemTheme: false,
        reminder: 'off',
        encryptedBackup: false,
        homepage: 'Notes',
        sort: 'default',
        sortOrder: 'desc',
        screenshotMode: true,
        privacyScreen: false,
        appLockMode: 'none', //none or // background // launch
      },
      visible: false,
    };
  }

  async open() {
    this.setState(
      {
        visible: true,
      },
      async () => {
        actionSheet.current?.setModalVisible(true);
        await this.getSettings();
      },
    );
  }

  async getSettings() {
    let settings = await MMKV.getItem('appSettings');
    this.setState({
      settings: JSON.parse(settings),
    });
  }

  async close() {
    actionSheet.current?.setModalVisible(false);
    await sleep(100);
    this.setState({
      visible: false,
    });
  }

  async componentDidMount() {
    eSubscribeEvent(eOpenSortDialog, this.open.bind(this));
    eSubscribeEvent(eCloseSortDialog, this.close.bind(this));
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eOpenSortDialog, this.open);
    eUnSubscribeEvent(eCloseSortDialog, this.close);
  }

  render() {
    const {colors} = this.props;

    if (!this.state.visible) return null;

    return (
      <ActionSheetWrapper fwdRef={actionSheet}>
        <View
          style={{
            width: '100%',
            backgroundColor: colors.bg,
            justifyContent: 'space-between',
            borderRadius: 10,
            paddingTop: 10,
          }}>
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 12,
              }}>
              <Heading
                size={SIZE.xl}
                style={{
                  alignSelf: 'center',
                }}>
                Sort by
              </Heading>

              <TouchableOpacity
                testID={notesnook.ids.dialogs.sortBy.order}
                onPress={async () => {
                  let value =
                    this.state.settings?.sortOrder === 'asc' ? 'desc' : 'asc';
                  await SettingsService.set('sortOrder', value);
                  sortSettings.sortOrder = value;
                  await this.getSettings();
                  useNoteStore.getState().setNotes();
                }}
                activeOpacity={1}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.accent,
                  borderRadius: 100,
                  paddingHorizontal: 8,
                  height: 22,
                  ...getElevation(2),
                }}>
                <Heading
                  size={SIZE.sm}
                  style={{
                    marginRight: 5,
                    color: 'white',
                  }}>
                  {this.state.settings?.sortOrder === 'asc'
                    ? 'Ascending'
                    : 'Descending'}
                </Heading>
                <Icon
                  color="white"
                  name={
                    this.state.settings?.sortOrder === 'asc'
                      ? 'sort-ascending'
                      : 'sort-descending'
                  }
                  size={SIZE.md}
                />
              </TouchableOpacity>
            </View>
            <Seperator />

            {Object.keys(SORT).map((item, index) => (
              <PressableButton
                key={item}
                testID={'btn-' + item}
                type={this.state.settings?.sort === item ? 'shade' : 'gray'}
                onPress={async () => {
                  await SettingsService.set('sort', item);
                  await this.getSettings();
                  sortSettings.sort = item;
                  useNoteStore.getState().setNotes();
                }}
                type="transparent"
                customStyle={{
                  width: '100%',
                  height: 50,
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 0,
                  paddingHorizontal: 12,
                }}>
                <Heading
                  size={SIZE.sm}
                  color={
                    this.state.settings?.sort === item
                      ? colors.accent
                      : colors.pri
                  }>
                  {item.slice(0, 1).toUpperCase() + item.slice(1, item.length)}
                </Heading>
                {this.state.settings?.sort === item ? (
                  <Icon color={colors.accent} name="check" size={SIZE.lg} />
                ) : null}
              </PressableButton>
            ))}
          </View>

          <View
            style={{
              height: 25,
            }}
          />
        </View>
      </ActionSheetWrapper>
    );
  }
}

export default SortDialog;
