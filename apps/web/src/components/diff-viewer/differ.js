export default class HTMLDiffer {
  constructor() {
    this.isReady = false;
    this.initializing = false;
    this.promiseQueue = [];
  }

  async _initialize() {
    if (this.isReady) return;
    this.initializing = true;
    this.worker = new Worker("/diff.worker.js");
    this.isReady = true;
    this.initializing = false;
  }

  _communicate(type, data, transferables = [], init = true) {
    return new Promise(async (resolve, reject) => {
      if (init) await this._initialize();
      const messageId = Math.random().toString(36).substr(2, 9);
      const onMessage = (e) => {
        const { type: _type, messageId: _mId, data } = e.data;
        if (_type === type && _mId === messageId) {
          this.worker.removeEventListener("message", onMessage);
          if (data.error) {
            console.error(data.error);
            return reject(data.error);
          }
          resolve(data);
        }
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.postMessage(
        {
          type,
          data,
          messageId,
        },
        transferables
      );
    });
  }

  generate = (before, after) => {
    return this._communicate("generate", { before, after });
  };

  clean = (html) => {
    return this._communicate("clean", { html });
  };
}
