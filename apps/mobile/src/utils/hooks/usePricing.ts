import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Subscription } from 'react-native-iap';
import PremiumService from '../../services/premium';
import { db } from '../database';

type PurchaseInfo = {
  country: string;
  countryCode: string;
  sku: string;
  discount: number;
};

const skuInfos: { [name: string]: PurchaseInfo | undefined } = {};

export const usePricing = (period: 'monthly' | 'yearly') => {
  const [current, setCurrent] = useState<{
    period: string;
    info?: PurchaseInfo;
    product?: Subscription;
  }>();

  const getDefaultSku = (period: 'monthly' | 'yearly') => {
    return period === 'monthly'
      ? 'com.streetwriters.notesnook.sub.mo'
      : 'com.streetwriters.notesnook.sub.yr';
  };

  useEffect(() => {
    (async () => {
      let skuInfo =
        skuInfos[period] ||
        (await db.pricing?.sku(Platform.OS === 'android' ? 'android' : 'ios', period));
      skuInfos[period] = skuInfo;
      let products = (await PremiumService.getProducts()) as Subscription[];
      let product = products.find(p => p.productId === skuInfo?.sku);
      if (!product) product = products.find(p => p.productId === getDefaultSku(period));
      console.log('skuInfos: ', skuInfos, product?.productId, product?.price, products.length);
      setCurrent({
        info: skuInfo,
        period,
        product
      });
    })();
  }, [period]);

  return current;
};
