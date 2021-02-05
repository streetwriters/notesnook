import React, {useEffect, useState} from 'react';
import {getLinkPreview} from 'link-preview-js';
import {Image, Linking, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {Button} from '../../../../components/Button';
import Heading from '../../../../components/Typography/Heading';
import Paragraph from '../../../../components/Typography/Paragraph';
import {useTracked} from '../../../../provider';
import {ToastEvent} from '../../../../services/EventManager';
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
        }}
        source={{uri: imageLink}}
      />
    ) : faviconLink ? (
      <Image
        style={{
          width: height,
          height: height,
          borderRadius: 5,
          marginVertical: 5,
        }}
        source={{uri: faviconLink}}
      />
    ) : null;
  };

  const openLink = () => {
    Linking.openURL(value)
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
          {title && (
            <Heading
              numberOfLines={1}
              style={{flexWrap: 'wrap', maxWidth: '90%', paddingLeft: 5}}
              size={SIZE.sm}>
              {name ? name + ': ' + title : title}
            </Heading>
          )}

          {description ||
            (title && (
              <Paragraph
                style={{flexWrap: 'wrap', maxWidth: '90%', paddingLeft: 5}}
                numberOfLines={2}
                color={colors.icon}
                size={SIZE.xs}>
                {description ? description : link.value}
              </Paragraph>
            ))}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}>
            {!title && !description && (
              <Paragraph
                onPress={openLink}
                style={{
                  textDecorationLine: 'underline',
                  color: colors.accent,
                }}>
                {value}
              </Paragraph>
            )}
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
    </>
  );
};

export default LinkPreview;
