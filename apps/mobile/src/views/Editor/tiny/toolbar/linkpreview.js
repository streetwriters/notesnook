import React, {useEffect, useState} from 'react';
import {Image, Linking, ScrollView, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ActionIcon} from '../../../../components/ActionIcon';
import Heading from '../../../../components/Typography/Heading';
import Paragraph from '../../../../components/Typography/Paragraph';
import {useTracked} from '../../../../provider';
import {openLinkInBrowser} from '../../../../utils/functions';
import {SIZE} from '../../../../utils/SizeUtils';
import {INPUT_MODE, properties, reFocusEditor} from './constants';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import isMobilePhone from 'validator/lib/isMobilePhone';
import {ToastEvent} from '../../../../services/EventManager';
import {getLinkPreview} from '../../../../utils/linkpreview';

let prevLink = {};
const LinkPreview = ({setMode, value, onSubmit}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [link, setLink] = useState(prevLink.value === value ? prevLink : {});

  useEffect(() => {
    console.log('previewing', value);
    if (value && prevLink.value !== value) {
      getLinkPreview(value)
        .then(r => {
          prevLink = {
            value: value,
            name: r.siteName,
            title: r.title,
            description: r.description,
            image: r.image
          };
          setLink(prevLink);
        })
        .catch(e => {
          console.log(e);
        });
    }
  }, [value]);

  const renderImage = image => {
    return image ? (
      <Image
        style={{
          width: 35,
          height: 35,
          borderRadius: 5,
          marginVertical: 5,
          borderWidth: 1,
          borderColor: colors.nav,
          backgroundColor: colors.nav,
          marginRight: 5
        }}
        resizeMode="contain"
        source={{uri: image}}
      />
    ) : (
      <View
        style={{
          width: 35,
          height: 35,
          marginVertical: 5,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.nav,
          borderRadius: 5
        }}>
        <Icon size={35} color={colors.accent} name="web" />
      </View>
    );
  };

  const openLink = () => {
    if (
      value.startsWith('mailto:') ||
      value.startsWith('tel:') ||
      value.startsWith('sms:')
    ) {
      Linking.openURL(value).catch(console.log);
      return;
    }

    if (isEmail(value)) {
      Linking.openURL(`mailto:${value}`).catch(console.log);
      return;
    }

    if (isMobilePhone(value)) {
      Linking.openURL(`tel:${value}`).catch(console.log);
      return;
    }

    if (isURL(value)) {
      openLinkInBrowser(value, colors)
        .catch(e => {})
        .then(async r => {
          console.log('closed browser now');
          await reFocusEditor();
        });
    } else {
      ToastEvent.show({
        heading: 'Url not valid',
        message: value,
        type: 'error'
      });
    }
  };

  const renderText = (name, title, description) => {
    return (
      <View
        style={{
          flex: 1
        }}>
        <TouchableOpacity onPress={openLink} activeOpacity={1}>
          <ScrollView
            style={{
              marginRight: 10
            }}
            horizontal
            showsHorizontalScrollIndicator={false}>
            <Heading numberOfLines={1} style={{paddingLeft: 5}} size={SIZE.sm}>
              {name ? name + ': ' + title : title ? title : 'Web Link'}
            </Heading>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Paragraph
              style={{flexWrap: 'wrap', paddingLeft: 5}}
              numberOfLines={1}
              color={colors.icon}
              size={SIZE.xs}>
              {description ? description : link?.value ? link.value : value}
            </Paragraph>
          </ScrollView>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center'
      }}>
      {renderImage(link.image)}
      {renderText(link.name, link.title, link.description)}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}>
        <ActionIcon
          onPress={() => {
            onSubmit('clear');
          }}
          customStyle={{
            width: 40,
            marginRight: 10,
            height: 40
          }}
          name="link-off"
          size={SIZE.xl}
          color={colors.pri}
        />
        <ActionIcon
          onPress={async () => {
            properties.pauseSelectionChange = true;
            setMode(INPUT_MODE.EDITING);
            properties.inputMode = INPUT_MODE.EDITING;
          }}
          customStyle={{
            width: 40,
            height: 40
          }}
          name="pencil"
          size={SIZE.xl - 4}
          color={colors.pri}
        />
      </View>
    </View>
  );
};

export default LinkPreview;
