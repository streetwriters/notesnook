import React, {Component} from 'react';
import {DeviceEventEmitter} from 'react-native';
import {ActionSheetComponent} from '../ActionSheetComponent';
import ActionSheet from '../ActionSheet';
export const ActionSheetEvent = (item, colors, tags, rowItems, columnItems) => {
  DeviceEventEmitter.emit('ActionSheetEvent', {
    item,
    colors,
    tags,
    rowItems,
    columnItems,
  });
};
export const ActionSheetHideEvent = () => {
  DeviceEventEmitter.emit('ActionSheetHideEvent');
};

export const _recieveEvent = (eventName, action) => {
  DeviceEventEmitter.addListener(eventName, action);
};

export const _unSubscribeEvent = (eventName, action) => {
  DeviceEventEmitter.removeListener(eventName, action);
};

export class DialogManager extends Component {
  constructor(props) {
    super(props);
    this.actionSheet;
    this.state = {
      item: {},
      actionSheetData: {
        colors: false,
        tags: false,
        rowItems: [],
        columnItems: [],
      },
    };
  }

  _showActionSheet = data => {
    this.setState(
      {
        actionSheetData: data,
        item: data.item,
      },
      () => {
        this.actionSheet._setModalVisible();
      },
    );
  };

  _hideActionSheet = () => {
    this.actionSheet._setModalVisible();
  };

  componentDidMount() {
    _recieveEvent('ActionSheetEvent', this._showActionSheet);
    _recieveEvent('ActionSheetHideEvent', this._hideActionSheet);
  }
  componentWillUnmount() {
    _unSubscribeEvent('ActionSheetEvent', this._showActionSheet);
    _unSubscribeEvent('ActionSheetHideEvent', this._hideActionSheet);
  }

  render() {
    let {colors, update} = this.props;
    let {actionSheetData, item} = this.state;
    return (
      <>
        <ActionSheet
          ref={ref => (this.actionSheet = ref)}
          customStyles={{
            backgroundColor: colors.bg,
          }}
          indicatorColor={colors.shade}
          initialOffsetFromBottom={0.5}
          bounceOnOpen={true}
          gestureEnabled={true}
          onClose={() => {
            //this.onMenuHide();
            if (this.willRefresh) {
              update('updateNotes');
            }
          }}>
          <ActionSheetComponent
            item={item}
            setWillRefresh={value => {
              this.willRefresh = true;
            }}
            hasColors={actionSheetData.colors}
            hasTags={actionSheetData.colors}
            overlayColor={
              colors.night ? 'rgba(225,225,225,0.1)' : 'rgba(0,0,0,0.3)'
            }
            rowItems={actionSheetData.rowItems}
            columnItems={actionSheetData.columnItems}
            close={value => {
              if (value) {
                this.show = value;
              }
              this.actionSheet._setModalVisible();
            }}
          />
        </ActionSheet>
      </>
    );
  }
}
