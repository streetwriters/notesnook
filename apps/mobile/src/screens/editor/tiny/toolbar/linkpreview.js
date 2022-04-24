import { getLinkPreview } from 'link-preview-js';
import React, { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { IconButton } from '../../../../components/ui/icon-button';
import Heading from '../../../../components/ui/typography/heading';
import Paragraph from '../../../../components/ui/typography/paragraph';
import { useThemeStore } from '../../../../stores/use-theme-store';
import { openLinkInBrowser } from '../../../../utils/functions';
import { SIZE } from '../../../../utils/size';
import { INPUT_MODE, properties, reFocusEditor } from './constants';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import isMobilePhone from 'validator/lib/isMobilePhone';
import { ToastEvent } from '../../../../services/event-manager';

let prevLink = {};
const LinkPreview = ({ setMode, value, onSubmit }) => {
  const colors = useThemeStore(state => state.colors);
  const [link, setLink] = useState(prevLink.value === value ? prevLink : {});

  useEffect(() => {
    console.log('previewing', value);
    if (value && prevLink.value !== value) {
      getLinkPreview(value)
        .then(r => {
          if (r.contentType?.includes('text/html')) {
            prevLink = {
              value: value,
              name: r.siteName,
              title: r.title,
              description: r.description,
              image: r.images && r.images[0],
              favicon: r.favicons && r.favicons[0]
            };
            setLink(prevLink);
          }
        })
        .catch(console.log);
    }
  }, [value]);

  const renderImage = (imageLink, faviconLink) => {
    return imageLink ? (
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
        source={{ uri: imageLink }}
      />
    ) : faviconLink ? (
      <View
        style={{
          borderColor: colors.nav,
          backgroundColor: colors.nav,
          borderWidth: 1,
          marginVertical: 5,
          borderRadius: 5
        }}
      >
        <Image
          style={{
            width: 35,
            height: 35
          }}
          resizeMode="center"
          source={{ uri: faviconLink }}
        />
      </View>
    ) : (
      <View
        style={{
          width: 35,
          height: 35,
          marginVertical: 5,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.shade,
          borderRadius: 5
        }}
      >
        <Icon size={35} color={colors.accent} name="web" />
      </View>
    );
  };

  const openLink = () => {
    if (value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('sms:')) {
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
      value = value.indexOf('://') === -1 ? 'http://' + value : value;
      openLinkInBrowser(value, colors)
        .catch(console.log)
        .then(async () => {
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
        }}
      >
        <TouchableOpacity onPress={openLink} activeOpacity={1}>
          <ScrollView
            style={{
              marginRight: 10
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Heading numberOfLines={1} style={{ paddingLeft: 5 }} size={SIZE.sm}>
              {name ? name + ': ' + title : title ? title : 'Web Link'}
            </Heading>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Paragraph
              style={{ flexWrap: 'wrap', paddingLeft: 5 }}
              numberOfLines={1}
              color={colors.icon}
              size={SIZE.xs}
            >
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
      }}
    >
      {renderImage(link.image, link.favicon)}
      {renderText(link.name, link.title, link.description)}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <IconButton
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
        <IconButton
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
