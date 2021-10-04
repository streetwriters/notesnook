import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

const NativeEventSource = Platform.OS === "ios"? null : NativeModules.EventSource;
const EventEmitter = Platform.OS === "ios"? null :  new NativeEventEmitter(NativeEventSource);

export default class EventSource {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.connect();
    this.open;
    this.message;
  }

  connect() {
    this.registerEvents();
    NativeEventSource.initRequest(this.url, this.options.headers);
  }

  close() {
    NativeEventSource.close();
    this.open?.remove();
    this.message?.remove();
  }

  registerEvents() {
    this.open = EventEmitter.addListener('open', () => {
      this.onopen();
    });

   this.message = EventEmitter.addListener("message", (ev) => {
      const {message} = ev;
      const eventData = {data: message};
      this.onmessage(eventData);
    });
  }
}
