import React, { createRef } from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { GROUP, SORT } from '../../utils';
import { db } from '../../utils/DB';
import { eCloseSortDialog, eOpenSortDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import { Button } from '../Button';
import { PressableButton } from '../PressableButton';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

class SortDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      groupOptions: null,
      visible: false,
    };
    this.actionSheet = createRef();
  }

  async open() {
    this.setState(
      {
        visible: true,
        groupOptions: db.settings.getGroupOptions(this.props.type),
      },
      async () => {
        this.actionSheet.current?.setModalVisible(true);
      },
    );
  }

  async close() {
    this.actionSheet.current?.setModalVisible(false);
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

  updateGroupOptions = async (_groupOptions) => {
    await db.settings.setGroupOptions(this.props.type, _groupOptions);
    this.setState({
      groupOptions: _groupOptions,
    });
    Navigation.setRoutesToUpdate([this.props.screen]);
  };

  render() {
    const {colors} = this.props;
    const {groupOptions, visible} = this.state;

    if (!visible) return null;

    return (
      <ActionSheetWrapper fwdRef={this.actionSheet}>
        <View
          style={{
            width: '100%',
            backgroundColor: colors.bg,
            justifyContent: 'space-between',
            borderRadius: 10,
            paddingTop: 10,
            paddingHorizontal: 12,
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

              <Button
                title={
                  groupOptions.sortDirection === 'asc'
                    ? 'Ascending'
                    : 'Descending'
                }
                icon={
                  groupOptions.sortDirection === 'asc'
                    ? 'sort-ascending'
                    : 'sort-descending'
                }
                height={25}
                iconPosition="right"
                type="accent"
                style={{
                  borderRadius: 100,
                }}
                onPress={async () => {
                  let _groupOptions = {
                    ...groupOptions,
                    sortDirection:
                      groupOptions.sortDirection === 'asc' ? 'desc' : 'asc',
                  };
                  await this.updateGroupOptions(_groupOptions);
                }}
              />
            </View>

            <Seperator />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}>
              {Object.keys(SORT).map((item, index) => (
                <Button
                  key={item}
                  type={groupOptions.sortBy === item? "transparent" : "gray"}
                  title={SORT[item]}
                  height={40}
                  iconPosition="left"
                  icon={groupOptions.sortBy === item ? "check-circle-outline" : "checkbox-blank-circle-outline"}
                  fontSize={SIZE.sm}
                  style={{
                    backgroundColor: 'transparent',
                  }}
                  onPress={async () => {
                    let _groupOptions = {
                      ...groupOptions,
                      sortBy: type === 'trash' ? 'dateDeleted' : item,
                    };
                    await this.updateGroupOptions(_groupOptions);
                  }}
                  iconSize={SIZE.lg}
                />
              ))}
            </View>

            <Seperator />
            <View>
              <Heading size={SIZE.xl}>Group by</Heading>
            </View>

            <Seperator />

            {Object.keys(GROUP).map((item, index) => (
              <PressableButton
                key={item}
                testID={'btn-' + item}
                type={groupOptions.groupBy === GROUP[item] ? 'shade' : 'gray'}
                onPress={async () => {
                  let _groupOptions = {
                    ...groupOptions,
                    groupBy: GROUP[item],
                  };

                  this.updateGroupOptions(_groupOptions);
                }}
                customStyle={{
                  width: '100%',
                  height: 50,
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 5,
                  paddingHorizontal: 12,
                  marginBottom: 10,
                }}>
                <Heading
                  size={SIZE.sm}
                  color={
                    groupOptions.groupBy === GROUP[item] 
                      ? colors.accent
                      : colors.icon
                  }>
                  {item.slice(0, 1).toUpperCase() + item.slice(1, item.length)}
                </Heading>
                {groupOptions.groupBy === GROUP[item] ? (
                  <Icon color={colors.accent} name="check" size={SIZE.lg} />
                ) : null}
              </PressableButton>
            ))}
          </View>
        </View>
      </ActionSheetWrapper>
    );
  }
}

export default SortDialog;
