import React from 'react';
import {
	TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import { useTracked } from '../../provider';
import layoutmanager from '../../utils/layout-manager';
import { SIZE } from '../../utils/SizeUtils';

const SectionHeader = ({title, collapsed, setCollapsed}) => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        layoutmanager.withAnimation(200);
        setCollapsed(!collapsed);
      }}
      style={{
        height: 50,
        paddingHorizontal: 0,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        width: '95%',
        alignSelf: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.nav
      }}>
      {collapsed ? (
        <Paragraph
          size={SIZE.md + 1}
          color={collapsed ? colors.icon : colors.accent}>
          {title}
        </Paragraph>
      ) : (
        <Heading size={SIZE.md + 1} color={colors.accent}>
          {title}
        </Heading>
      )}

      <Icon
        name={collapsed ? 'chevron-down' : 'chevron-up'}
        color={collapsed ? colors.icon : colors.accent}
        size={SIZE.lg}
      />
    </TouchableOpacity>
  );
};

export default SectionHeader;
