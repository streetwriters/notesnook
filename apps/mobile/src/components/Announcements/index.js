import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {
  eCloseAnnouncementDialog,
  eOpenAnnouncementDialog
} from '../../utils/Events';
import BaseDialog from '../Dialog/base-dialog';
import {Body} from './body';
import {Description} from './description';
import {Photo} from './photo';
import {SubHeading} from './subheading';
import {List} from './list';
import {Title} from './title';
import {Cta} from './cta';
import {allowedPlatforms} from '../../provider/stores';
import {ProFeatures} from '../ResultDialog/pro-features';

const announcement_dialog_info = {
  body: [
    {
      type: 'image',
      src: 'https://media.istockphoto.com/vectors/flash-sale-promotional-labels-templates-set-special-offer-text-design-vector-id1195558677?s=170667a',
      caption: 'an image of a bear',
      style: {}
    },
    {
      type: 'title',
      text: "Don't miss out on this one!",
      style: {
        textAlign: 'center',
        marginTop: 1
      }
    },
    {
      type: 'description',
      text: "It's 50% off on Notesnook Pro today. Grab the offer now before it's too late.",
      style: {
        textAlign: 'center',
        marginBottom: 1
      }
    },
    {
      type: 'features'
    }
    // {
    //   type: 'subheading',
    //   text: 'New image tool'
    // },
    // {
    //   type: 'body',
    //   text: 'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer.'
    // },
    // {
    //   type: 'list',
    //   items: [
    //     {
    //       text: 'Lorem ipsum dolor sit amet'
    //     },
    //     {
    //       text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium'
    //     }
    //   ]
    // }
  ],
  callToActions: [
    {
      text: 'Get 50% Off for One Year',
      action: 'none',
      platforms: ['mobile']
    }
  ]
};

const Features = () => {
  return (
    <View
      style={{
        paddingHorizontal: 12,
		alignItems:'center',
		width:'100%'
      }}>
      <ProFeatures />
    </View>
  );
};

const renderItems = {
  title: Title,
  description: Description,
  body: Body,
  cta: Cta,
  image: Photo,
  list: List,
  subheading: SubHeading,
  features: Features
};

const renderItem = ({item, index}) => {
  const Item = renderItems[item.type];

  return <Item {...item} index={index} />;
};

export const Announcement = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    eSubscribeEvent(eOpenAnnouncementDialog, open);
    eSubscribeEvent(eCloseAnnouncementDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenAnnouncementDialog, open);
      eUnSubscribeEvent(eCloseAnnouncementDialog, close);
    };
  }, [visible]);

  const open = () => {
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return (
    <BaseDialog
      animated={false}
      centered={false}
      bottom={true}
      visible={visible}>
      <View
        style={{
          width: '100%',
          backgroundColor: colors.bg,
          maxHeight: '100%'
        }}>
        <FlatList
          style={{
            width: '100%'
          }}
          data={announcement_dialog_info.body}
          renderItem={renderItem}
        />

        <Cta
          actions={announcement_dialog_info.callToActions.filter(item =>
            item.platforms.some(
              platform => allowedPlatforms.indexOf(platform) > -1
            )
          )}
        />
        <View
          style={{
            height: 15
          }}
        />
      </View>
    </BaseDialog>
  );
};
