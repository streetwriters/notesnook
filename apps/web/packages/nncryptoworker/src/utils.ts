type Message<T> = {
  type: string;
  data?: T;
};

export function sendEventWithResult<T>(type: string, data?: any): Promise<T> {
  return new Promise<T>((resolve) => {
    // eslint-disable-next-line no-restricted-globals
    addEventListener(
      "message",
      (ev: MessageEvent<Message<T>>) => {
        const { type: messageType, data } = ev.data;
        if (messageType === type && data) {
          resolve(data);
        }
      },
      { once: true }
    );
    postMessage({ type, data });
  });
}
