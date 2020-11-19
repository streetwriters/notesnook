import React, {createRef} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {dWidth, SORT, sortSettings} from '../../utils';
import ActionSheet from '../ActionSheet';
import {DDS} from '../../services/DeviceDetection';
import {eCloseSortDialog, eOpenSortDialog} from '../../utils/Events';
import {PressableButton} from '../PressableButton';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import {defaultState} from '../../provider/DefaultState';
import {MMKV} from '../../utils/mmkv';
import {updateEvent} from '../DialogManager/recievers';
import {Actions} from '../../provider/Actions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Seperator from '../Seperator';
import SettingsService from '../../services/SettingsService';
import Paragraph from '../Typography/Paragraph';
import Heading from '../Typography/Heading';

const actionSheet = createRef();

class SortDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: defaultState.settings,
    };
  }

  async open() {
    actionSheet.current?._setModalVisible(true);
    await this.getSettings();
  }

  async getSettings() {
    let settings = await MMKV.getItem('settings');
    this.setState({
      settings: JSON.parse(settings),
    });
  }

  close() {
    actionSheet.current?._setModalVisible(false);
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
    return (
      <ActionSheet
        containerStyle={{
          backgroundColor: colors.bg,
          alignSelf: 'center',
          width: DDS.isTab ? 500 : '100%',
          borderRadius: 10,
          marginBottom: DDS.isTab ? 50 : 0,
        }}
        extraScroll={DDS.isTab ? 50 : 0}
        gestureEnabled={true}
        footerAlwaysVisible={DDS.isTab}
        footerHeight={DDS.isTab ? 20 : 10}
        footerStyle={
          DDS.isTab
            ? {
                borderRadius: 10,
                backgroundColor: colors.bg,
              }
            : null
        }
        ref={actionSheet}
        initialOffsetFromBottom={1}>
        <View
          style={{
            width: DDS.isTab ? 500 : dWidth,
            backgroundColor: colors.bg,
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            borderRadius: 10,
            paddingTop: 10,
          }}>
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Heading
                size={SIZE.xl}
                style={{
                  alignSelf: 'center',
                }}>
                Sort by
              </Heading>

              <TouchableOpacity
                onPress={async () => {
                  let value =
                    this.state.settings.sortOrder === 'asc' ? 'des' : 'asc';
                  await SettingsService.set('sortOrder', value);
                  sortSettings.sortOrder = value;
                  await this.getSettings();
                }}
                activeOpacity={1}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Paragraph
                  style={{
                    marginRight: 5,
                  }}>
                  {this.state.settings.sortOrder === 'asc'
                    ? 'Ascending'
                    : 'Descending'}
                </Paragraph>
                <Icon
                  color={colors.pri}
                  name={
                    this.state.settings.sortOrder === 'asc'
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
                color={
                  this.state.settings.sort === item
                    ? colors.shade
                    : 'transparent'
                }
                onPress={async () => {
                  await SettingsService.set('sort', item);
                  await this.getSettings();
                  sortSettings.sort = item;
                  updateEvent({type: Actions.NOTES});
                }}
                selectedColor={
                  this.state.settings.sort === item ? colors.accent : colors.nav
                }
                alpha={!colors.night ? -0.02 : 0.02}
                opacity={this.state.settings.sort === item ? 0.12 : 1}
                customStyle={{
                  width: '100%',
                  height: 50,
                }}>
                <Paragraph
                  color={
                    this.state.settings.sort === item
                      ? colors.accent
                      : colors.pri
                  }>
                  {item.slice(0, 1).toUpperCase() + item.slice(1, item.length)}
                </Paragraph>
              </PressableButton>
            ))}
          </View>
        </View>
      </ActionSheet>
    );
  }
}

export default SortDialog;
