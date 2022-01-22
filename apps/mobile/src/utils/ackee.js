import { AppState, Platform } from 'react-native';

const platform = {
  osName: Platform.OS,
  osVersion: Platform.Version
};

const isBrowser = typeof window !== 'undefined';

/**
 * Validates options and sets defaults for undefined properties.
 * @param {?Object} opts
 * @returns {Object} opts - Validated options.
 */
const validate = function (opts = {}) {
  // Create new object to avoid changes by reference
  const _opts = {};

  // Defaults to false
  _opts.detailed = opts.detailed === true;

  // Defaults to true
  _opts.ignoreLocalhost = opts.ignoreLocalhost !== false;

  // Defaults to true
  _opts.ignoreOwnVisits = opts.ignoreOwnVisits !== false;

  return _opts;
};

/**
 * Determines if a host is a localhost.
 * @param {String} hostname - Hostname that should be tested.
 * @returns {Boolean} isLocalhost
 */
const isLocalhost = function (hostname) {
  return __DEV__;
};

/**
 * Determines if user agent is a bot. Approach is to get most bots, assuming other bots don't run JS.
 * Source: https://stackoverflow.com/questions/20084513/detect-search-crawlers-via-javascript/20084661
 * @param {String} userAgent - User agent that should be tested.
 * @returns {Boolean} isBot
 */
const isBot = function (userAgent) {
  return /bot|crawler|spider|crawling/i.test(userAgent);
};

/**
 * Checks if an id is a fake id. This is the case when Ackee ignores you because of the `ackee_ignore` cookie.
 * @param {String} id - Id that should be tested.
 * @returns {Boolean} isFakeId
 */
const isFakeId = function (id) {
  return id === '88888888-8888-8888-8888-888888888888';
};

/**
 * Checks if the website is in background (e.g. user has minimzed or switched tabs).
 * @returns {boolean}
 */
const isInBackground = function () {
  return AppState.currentState === 'background';
};

/**
 * Get the optional source parameter.
 * @returns {String} source
 */
const source = function () {
  return undefined;
};

/**
 * Gathers all platform-, screen- and user-related information.
 * @param {Boolean} detailed - Include personal data.
 * @returns {Object} attributes - User-related information.
 */
export const attributes = function (detailed = false) {
  const defaultData = {
    siteLocation: 'com.streetwriters.notesnook',
    siteReferrer: '',
    source: source(),
    osName: platform.osName
  };

  return {
    ...defaultData
  };
};

/**
 * Creates an object with a query and variables property to create a record on the server.
 * @param {String} domainId - Id of the domain.
 * @param {Object} input - Data that should be transferred to the server.
 * @returns {Object} Create record body.
 */
const createRecordBody = function (domainId, input) {
  return {
    query: `
			mutation createRecord($domainId: ID!, $input: CreateRecordInput!) {
				createRecord(domainId: $domainId, input: $input) {
					payload {
						id
					}
				}
			}
		`,
    variables: {
      domainId,
      input
    }
  };
};

/**
 * Creates an object with a query and variables property to update a record on the server.
 * @param {String} recordId - Id of the record.
 * @returns {Object} Update record body.
 */
const updateRecordBody = function (recordId) {
  return {
    query: `
			mutation updateRecord($recordId: ID!) {
				updateRecord(id: $recordId) {
					success
				}
			}
		`,
    variables: {
      recordId
    }
  };
};

/**
 * Creates an object with a query and variables property to create an action on the server.
 * @param {String} eventId - Id of the event.
 * @param {Object} input - Data that should be transferred to the server.
 * @returns {Object} Create action body.
 */
const createActionBody = function (eventId, input) {
  return {
    query: `
			mutation createAction($eventId: ID!, $input: CreateActionInput!) {
				createAction(eventId: $eventId, input: $input) {
					payload {
						id
					}
				}
			}
		`,
    variables: {
      eventId,
      input
    }
  };
};

/**
 * Creates an object with a query and variables property to update an action on the server.
 * @param {String} actionId - Id of the action.
 * @param {Object} input - Data that should be transferred to the server.
 * @returns {Object} Update action body.
 */
const updateActionBody = function (actionId, input) {
  return {
    query: `
			mutation updateAction($actionId: ID!, $input: UpdateActionInput!) {
				updateAction(id: $actionId, input: $input) {
					success
				}
			}
		`,
    variables: {
      actionId,
      input
    }
  };
};

/**
 * Construct URL to the GraphQL endpoint of Ackee.
 * @param {String} server - URL of the Ackee server.
 * @returns {String} endpoint - URL to the GraphQL endpoint of the Ackee server.
 */
const endpoint = function (server) {
  const hasTrailingSlash = server.substr(-1) === '/';

  return server + (hasTrailingSlash === true ? '' : '/') + 'api';
};

/**
 * Sends a request to a specified URL.
 * Won't catch all errors as some are already logged by the browser.
 * In this case the callback won't fire.
 * @param {String} url - URL to the GraphQL endpoint of the Ackee server.
 * @param {Object} body - JSON which will be send to the server.
 * @param {Object} opts - Options.
 * @param {?Function} next - The callback that handles the response. Receives the following properties: json.
 */
const send = function (url, body, opts, next) {
  const xhr = new XMLHttpRequest();

  xhr.open('POST', url);

  xhr.onload = () => {
    if (xhr.status !== 200) {
      throw new Error('Server returned with an unhandled status');
    }

    let json = null;

    try {
      json = JSON.parse(xhr.responseText);
    } catch (e) {
      throw new Error('Failed to parse response from server');
    }

    if (json.errors != null) {
      throw new Error(json.errors[0].message);
    }

    if (typeof next === 'function') {
      return next(json);
    }
  };

  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xhr.withCredentials = opts.ignoreOwnVisits;

  xhr.send(JSON.stringify(body));
};

/**
 * Creates a new instance.
 * @param {String} server - URL of the Ackee server.
 * @param {?Object} opts
 * @returns {Object} instance
 */
export const create = function (server, opts) {
  opts = validate(opts);
  const url = endpoint(server);
  const noop = () => {};

  // Fake instance when Ackee ignores you
  const fakeInstance = {
    record: () => ({ stop: noop }),
    updateRecord: () => ({ stop: noop }),
    action: noop,
    updateAction: noop
  };

  if (opts.ignoreLocalhost === true && isLocalhost() === true) {
    console.warn('Ackee ignores you because you are on localhost');
    return fakeInstance;
  }
  // Creates a new record on the server and updates the record
  // very x seconds to track the duration of the visit. Tries to use
  // the default attributes when there're no custom attributes defined.
  const _record = (domainId, attrs = attributes(opts.detailed), next) => {
    // Function to stop updating the record
    let isStopped = false;
    const stop = () => {
      isStopped = true;
    };

    send(url, createRecordBody(domainId, attrs), opts, json => {
      const recordId = json.data.createRecord.payload.id;

      if (isFakeId(recordId) === true) {
        return console.warn('Ackee ignores you because this is your own site');
      }

      const interval = setInterval(() => {
        if (isStopped === true) {
          clearInterval(interval);
          return;
        }

        if (isInBackground() === true) return;

        send(url, updateRecordBody(recordId), opts);
      }, 15000);

      if (typeof next === 'function') {
        return next(recordId);
      }
    });

    return { stop };
  };

  // Updates a record very x seconds to track the duration of the visit
  const _updateRecord = recordId => {
    // Function to stop updating the record
    let isStopped = false;
    const stop = () => {
      isStopped = true;
    };

    if (isFakeId(recordId) === true) {
      console.warn('Ackee ignores you because this is your own site');
      return { stop };
    }

    const interval = setInterval(() => {
      if (isStopped === true) {
        clearInterval(interval);
        return;
      }

      if (isInBackground() === true) return;

      send(url, updateRecordBody(recordId), opts);
    }, 15000);

    return { stop };
  };

  // Creates a new action on the server
  const _action = (eventId, attrs, next) => {
    send(url, createActionBody(eventId, attrs), opts, json => {
      const actionId = json.data.createAction.payload.id;

      if (isFakeId(actionId) === true) {
        return console.warn('Ackee ignores you because this is your own site');
      }

      if (typeof next === 'function') {
        return next(actionId);
      }
    });
  };

  // Updates an action
  const _updateAction = (actionId, attrs) => {
    if (isFakeId(actionId) === true) {
      return console.warn('Ackee ignores you because this is your own site');
    }

    send(url, updateActionBody(actionId, attrs), opts);
  };

  // Return the real instance
  return {
    record: _record,
    updateRecord: _updateRecord,
    action: _action,
    updateAction: _updateAction
  };
};
