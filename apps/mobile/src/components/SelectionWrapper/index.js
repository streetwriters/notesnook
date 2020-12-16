import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {COLORS_NOTE} from '../../utils/Colors';
import {hexToRGBA, RGB_Linear_Shade} from '../../utils/ColorUtils';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const Filler = ({item, background}) => {
  const [state] = useTracked();
  const {colors, currentEditingNote} = state;
  const color = item.color || 'accent';

  return (
    <View
      style={{
        /*   backgroundColor: DDS.isLargeTablet()
          ? currentEditingNote === item.id
            ? item.type === 'note' && item.color
              ? COLORS_NOTE[item.color]
              : colors.shade
            : background
            ? background
            : 'transparent'
          : 'transparent', */
        position: 'absolute',
        width: '110%',
        height: '110%',
        paddingVertical: '3.5%',
        paddingHorizontal: '5%',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}>
      <View
        style={{
          flexDirection: 'row',
        }}>
        {item.conflicted ? (
          <View
            style={{
              backgroundColor: hexToRGBA(colors.red, 0.12),
              paddingHorizontal: 3,
              paddingVertical: 2,
              borderRadius: 3,
              marginRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Icon name="alert-circle" size={SIZE.xxs} color={colors.red} />
            <Heading
              size={SIZE.xxs}
              style={{
                color: colors.red,
                marginLeft: 5,
              }}>
              CONFLICTS
            </Heading>
          </View>
        ) : null}

        {currentEditingNote === item.id ? (
          <View
            style={{
              backgroundColor: hexToRGBA(colors[color], 0.12),
              paddingHorizontal: 3,
              paddingVertical: 2,
              borderRadius: 3,
              marginRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Icon name="pencil-outline" size={SIZE.xxs} color={colors[color]} />
            <Heading
              size={SIZE.xxs}
              style={{marginLeft: 5}}
              color={colors[color]}>
              EDITING NOW
            </Heading>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const SelectionWrapper = ({
  children,
  item,
  index,
  background,
  onLongPress,
  onPress,
  testID,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;
  const [selected, setSelected] = useState(false);
  useEffect(() => {
    let exists = selectedItemsList.filter(
      (o) => o.dateCreated === item.dateCreated,
    );

    if (exists[0]) {
      if (!selected) {
        setSelected(true);
      }
    } else {
      if (selected) {
        setSelected(false);
      }
    }
  }, [selectedItemsList]);

  return (
    <PressableButton
      customColor="transparent"
      testID={testID}
      onLongPress={onLongPress}
      onPress={onPress}
      customSelectedColor={colors.nav}
      customAlpha={!colors.night ? -0.02 : 0.02}
      customOpacity={1}
      customStyle={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        borderRadius: 0,
        overflow: 'hidden',
        marginTop:
          index === 0 && !selectionMode
            ? 15
            : index === 0 && selectionMode
            ? 30
            : 0,
      }}>
      {item.type === 'note' ? (
        <Filler background={background} item={item} />
      ) : null}

      <View
        style={{
          display: selectionMode ? 'flex' : 'none',
          opacity: selectionMode ? 1 : 0,
          width: '10%',
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
          paddingRight: 8,
        }}>
        {item.title !== 'General' && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={onLongPress}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              height: 70,
            }}>
            <Icon
              size={SIZE.lg}
              color={selected ? colors.accent : colors.icon}
              name={
                selected
                  ? 'check-circle-outline'
                  : 'checkbox-blank-circle-outline'
              }
            />
          </TouchableOpacity>
        )}
      </View>

      {children}
    </PressableButton>
  );
};

export default SelectionWrapper;
