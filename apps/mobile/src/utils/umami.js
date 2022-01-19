import {Platform} from 'react-native';
import {MMKV} from './mmkv';
import {useSettingStore} from '../provider/stores';

const WEBSITE_ID = `3c6890ce-8410-49d5-8831-15fb2eb28a21`;
const baseUrl = `https://analytics.streetwriters.co/api/collect`;

const UA =
  Platform.OS === 'ios'
    ? `Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1`
    : `
Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36`;

/**
 *
 * @param {Routes} route
 * @param {Routes[]} conditions
 * @returns
 */
async function canUpdateAnalytics(route, conditions = []) {
  if (!useSettingStore?.getState()?.settings?.telemetry) return false;
  let eventsList = await MMKV.getItem('notesnookUserEvents');

  if (eventsList) {
    eventsList = JSON.parse(eventsList);
  }

  if (eventsList && eventsList[route]) {
    console.log('analytics: event already sent', route);
    return false;
  }
  if (route !== '/welcome') {
    for (cond of conditions) {
      if (!eventsList || !eventsList[cond]) {
        console.log('analytics: conditions not met for event', route, cond);
        return false;
      }
    }
  }
  console.log('analytics: will send event', route);
  return true;
}

async function saveAnalytics(route, value = true) {
  let eventsList = await MMKV.getItem('notesnookUserEvents');
  if (eventsList) {
    eventsList = JSON.parse(eventsList);
  } else {
    eventsList = {};
  }
  eventsList[route] = value;
  await MMKV.setItem('notesnookUserEvents', JSON.stringify(eventsList));
}

/**
 *@typedef {"/welcome" | "/home" | "/signup" | "/first-note" | "/account-created" | "/pro-sheet" | "/pro-plans" | "/iap-native" | "/pro-screen" | "/editor" | "/editor-toolbar" | "/properties" | "/sidemenu"} Routes
 * @param {Routes} prevRoute
 * @param {Routes} route
 * @param {Routes[]} conditions
 * @param {boolean} once
 * @returns
 */

async function pageView(
  route,
  prevRoute = '',
  conditions = ['/welcome'],
  once = true
) {
  if (!(await canUpdateAnalytics(route, conditions)) && once) return;
  let body = {
    payload: {
      website: WEBSITE_ID,
      url: `notesnook-${Platform.OS}${prevRoute}${route}`,
      referrer: `https://notesnook.com/notesnook-${Platform.OS}${prevRoute}`,
      hostname: `notesnook-${Platform.OS}`,
      language: 'en-US',
      screen: '1920x1080'
    },
    type: 'pageview'
  };

  try {
    let response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA
      },
      body: JSON.stringify(body)
    });
    console.log('analytics: event sent', route);
    await saveAnalytics(route);
    return await response.text();
  } catch (e) {
    console.log(e);
  }
}

async function sendEvent(type, value, once = true) {
  if (!(await canUpdateAnalytics(type)) && once) return;
  let body = {
    payload: {
      website: WEBSITE_ID,
      url: '/',
      event_type: type,
      event_value: value,
      hostname: 'notesnook-android-app',
      language: 'en-US',
      screen: '1920x1080'
    },
    type: 'event'
  };

  try {
    let response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA
      },
      body: JSON.stringify(body)
    });
    console.log(response.status);
    return await response.text();
  } catch (e) {
    console.log(e);
  }
}

export default {
  sendEvent,
  pageView,
  saveAnalytics
};
