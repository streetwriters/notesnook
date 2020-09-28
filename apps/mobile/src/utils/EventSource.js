import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

const NativeEventSource = Platform.OS === "ios"? null : NativeModules.EventSource;
const EventEmitter = Platform.OS === "ios"? null :  new NativeEventEmitter(NativeEventSource);

export default class EventSource {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.connect();
  }

  connect() {
    this.registerEvents();
    NativeEventSource.initRequest(this.url, this.options.headers);
  }

  close() {
    NativeEventSource.close();
  }

  registerEvents() {
    EventEmitter.addListener('open', () => {
      this.onopen();
    });

    EventEmitter.addListener("message", (ev) => {
      const {message} = ev;
      const eventData = {data: message};
      this.onmessage(eventData);
    });
  }
}
