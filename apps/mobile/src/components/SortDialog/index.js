import React, {createRef} from 'react';
import {Platform, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {Actions} from '../../provider/Actions';
import {defaultState} from '../../provider/DefaultState';
import {DDS} from '../../services/DeviceDetection';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import SettingsService from '../../services/SettingsService';
import {dWidth, getElevation, SORT, sortSettings} from '../../utils';
import {hexToRGBA} from '../../utils/ColorUtils';
import {eCloseSortDialog, eOpenSortDialog} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import ActionSheet from '../ActionSheet';
import {updateEvent} from '../DialogManager/recievers';
import {PressableButton} from '../PressableButton';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';

const actionSheet = createRef();

class SortDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: defaultState.settings,
      visible: false,
    };
  }

  async open() {
    this.setState(
      {
        visible: true,
      },
      async () => {
        actionSheet.current?._setModalVisible(true);
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

  close() {
    actionSheet.current?._setModalVisible(false);
    sleep(200).then(() => {
      this.setState({
        visible: false,
      });
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
      <ActionSheet
        containerStyle={{
          backgroundColor: colors.bg,
          alignSelf: 'center',
          width: DDS.isTab ? 500 : '100%',
          borderRadius: 10,
          marginBottom: DDS.isTab ? 50 : 0,
        }}
        indicatorColor={
          Platform.ios
            ? hexToRGBA(colors.accent + '19')
            : hexToRGBA(colors.shade)
        }
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
                    this.state.settings.sortOrder === 'asc' ? 'des' : 'asc';
                  await SettingsService.set('sortOrder', value);
                  sortSettings.sortOrder = value;
                  await this.getSettings();
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
                  {this.state.settings.sortOrder === 'asc'
                    ? 'Ascending'
                    : 'Descending'}
                </Heading>
                <Icon
                  color="white"
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
                testID={'btn-' + item}
                type={this.state.settings.sort === item ? 'shade' : 'gray'}
                onPress={async () => {
                  await SettingsService.set('sort', item);
                  await this.getSettings();
                  sortSettings.sort = item;
                  updateEvent({type: Actions.NOTES});
                }}
                type="transparent"
                customStyle={{
                  width: '100%',
                  height: 50,
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius:0,
                  paddingHorizontal:12
                }}>
                <Heading
                  size={SIZE.sm}
                  color={
                    this.state.settings.sort === item
                      ? colors.accent
                      : colors.pri
                  }>
                  {item.slice(0, 1).toUpperCase() + item.slice(1, item.length)}
                </Heading>
                {this.state.settings.sort === item ? (
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
      </ActionSheet>
    );
  }
}

export default SortDialog;
