import { getLinkPreview } from 'link-preview-js';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActionIcon } from '../../../../components/ActionIcon';
import Heading from '../../../../components/Typography/Heading';
import Paragraph from '../../../../components/Typography/Paragraph';
import { useTracked } from '../../../../provider';
import { openLinkInBrowser } from '../../../../utils/functions';
import { SIZE } from '../../../../utils/SizeUtils';
import { INPUT_MODE, properties, reFocusEditor } from './constants';

let prevLink = {};
let prevHeight = 50;
const LinkPreview = ({setMode, value, onSubmit}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [link, setLink] = useState(prevLink.value === value ? prevLink : {});
  const [height, setHeight] = useState(prevHeight);

  useEffect(() => {
    if (value && prevLink.value !== value) {
      getLinkPreview(value)
        .then((r) => {
          if (r.contentType?.includes('text/html')) {
            prevLink = {
              value: value,
              name: r.siteName,
              title: r.title,
              description: r.description,
              image: r.images[0],
              favicon: r.favicons[0],
            };
            setLink(prevLink);
          }
        })
        .catch((e) => console.log);
    }
  }, []);

  const renderImage = (imageLink, faviconLink) => {
    return imageLink ? (
      <Image
        style={{
          width: height,
          height: height,
          borderRadius: 5,
          marginVertical: 5,
          borderWidth: 1,
          borderColor: colors.nav,
          backgroundColor: colors.nav,
        }}
        resizeMode="center"
        source={{uri: imageLink}}
      />
    ) : faviconLink ? (
      <View
        style={{
          borderColor: colors.nav,
          backgroundColor: colors.nav,
          borderWidth: 1,
          marginVertical: 5,
          borderRadius: 5,
        }}>
        <Image
          style={{
            width: height,
            height: height,
          }}
          resizeMode="center"
          source={{uri: faviconLink}}
        />
      </View>
    ) : (
      <View
        style={{
          width: height,
          height: height,
          marginVertical: 5,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.shade,
          borderRadius: 5,
        }}>
        <Icon size={height - 4} color={colors.accent} name="web" />
      </View>
    );
  };

  const openLink = () => {
    openLinkInBrowser(value, colors)
      .catch((e) => {})
      .then(async (r) => {
        console.log('closed browser now');
        await reFocusEditor();
      });
  };

  const renderText = (name, title, description) => {
    return (
      <View
        onLayout={(e) => {
          prevHeight = e.nativeEvent.layout.height;
          e.nativeEvent && setHeight(prevHeight);
        }}
        style={{
          flex: 1,
        }}>
        <TouchableOpacity onPress={openLink} activeOpacity={1}>
          <ScrollView
            style={{
              marginRight: 10,
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
    <>
      {renderImage(link.image, link.favicon)}
      {renderText(link.name, link.title, link.description)}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <ActionIcon
          onPress={() => {
            onSubmit('clear');
          }}
          customStyle={{
            width: 40,
            marginHorizontal: 10,
            height: 40,
          }}
          name="delete"
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
            marginHorizontal: 10,
            height: 40,
          }}
          name="pencil"
          size={SIZE.xl}
          color={colors.pri}
        />
      </View>
    </>
  );
};

export default LinkPreview;
