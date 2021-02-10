import {getLinkPreview} from 'link-preview-js';
import React, {useEffect, useState} from 'react';
import {Image, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Button} from '../../../../components/Button';
import Heading from '../../../../components/Typography/Heading';
import Paragraph from '../../../../components/Typography/Paragraph';
import {useTracked} from '../../../../provider';
import {ToastEvent} from '../../../../services/EventManager';
import {openLinkInBrowser} from '../../../../utils/functions';
import {SIZE} from '../../../../utils/SizeUtils';
import {INPUT_MODE, properties} from './constants';

let prevLink = {};
let prevHeight = 65;
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
        }}
        resizeMode="cover"
        source={{uri: imageLink}}
      />
    ) : faviconLink ? (
      <View
        style={{
          borderColor: colors.nav,
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
        <Icon size={40} color={colors.accent} name="web" />
      </View>
    );
  };

  const openLink = () => {
    openLinkInBrowser(value, colors)
      .catch((e) => ToastEvent.show(e.message, 'error'))
      .then((r) => {
        console.log('closed');
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
          <Heading
            numberOfLines={1}
            style={{flexWrap: 'wrap', maxWidth: '90%', paddingLeft: 5}}
            size={SIZE.sm}>
            {name ? name + ': ' + title : title ? title : 'Web Link'}
          </Heading>

          <Paragraph
            style={{flexWrap: 'wrap', maxWidth: '90%', paddingLeft: 5}}
            numberOfLines={2}
            color={colors.icon}
            size={SIZE.xs}>
            {description ? description : link?.value ? link.value : value}
          </Paragraph>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Button
                onPress={() => {
                  setMode(INPUT_MODE.EDITING);
                  properties.inputMode = INPUT_MODE.EDITING;
                }}
                style={{
                  paddingHorizontal: 6,
                }}
                height={25}
                fontSize={SIZE.sm}
                title="Edit"
              />
              <Button
                type="errorShade"
                onPress={() => {
                  onSubmit('clear');
                }}
                height={25}
                fontSize={SIZE.sm}
                title="Remove"
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {renderImage(link.image, link.favicon)}
      {renderText(link.name, link.title, link.description)}

      <Button
        type="shade"
        title="Visit"
        icon="open-in-new"
        onPress={openLink}
      />
    </>
  );
};

export default LinkPreview;
