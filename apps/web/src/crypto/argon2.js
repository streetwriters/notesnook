const logger = console;
const isDesktop = !!(
  window.process &&
  window.process.versions &&
  window.process.versions.electron
);
const canUseWasmInWebWorker =
  !isDesktop && !/Chrome/.test(navigator.appVersion);
const Argon2 = {
  argon2(
    password,
    salt,
    memory,
    iterations,
    length,
    parallelism,
    type,
    version
  ) {
    const args = {
      password,
      salt,
      memory,
      iterations,
      length,
      parallelism,
      type,
      version
    };
    return this.loadRuntime(memory).then(runtime => {
      //const ts = //logger.ts();
      return runtime.hash(args).then(hash => {
        // logger.debug("Hash computed", logger.ts(ts));
        return hash;
      });
    });
  },

  loadRuntime(requiredMemory) {
    if (this.runtimeModule) {
      return Promise.resolve(this.runtimeModule);
    }
    if (!global.WebAssembly) {
      return Promise.reject("WebAssembly is not supported");
    }
    return new Promise((resolve, reject) => {
      const loadTimeout = setTimeout(() => reject("timeout"), 5000);
      try {
        //const ts = //logger.ts();
        const argon2LoaderCode = require("./argon2-loader").default;
        //const wasmBinaryBase64 = require("./argon2-wasm").default;

        const KB = 1024 * 1024;
        const MB = 1024 * KB;
        const GB = 1024 * MB;
        const WASM_PAGE_SIZE = 64 * 1024;
        const totalMemory = (2 * GB - 64 * KB) / 1024 / WASM_PAGE_SIZE;
        const initialMemory = Math.min(
          Math.max(Math.ceil((requiredMemory * 1024) / WASM_PAGE_SIZE), 256) +
            256,
          totalMemory
        );

        if (canUseWasmInWebWorker) {
          console.log("web worker");
          const memoryDecl = `var wasmMemory=new WebAssembly.Memory({initial:${initialMemory},maximum:${totalMemory}});`;
          const moduleDecl =
            "var Module={" +
            'wasmJSMethod: "native-wasm",' +
            'wasmBinaryFile: "argon2.wasm",' +
            "locateFile: (path) => { return path; }," +
            'print(...args) { postMessage({op:"log",args}) },' +
            'printErr(...args) { postMessage({op:"log",args}) },' +
            "postRun:" +
            this.workerPostRun.toString() +
            "," +
            "calcHash:" +
            this.calcHash.toString() +
            "," +
            "wasmMemory:wasmMemory," +
            "buffer:wasmMemory.buffer," +
            "TOTAL_MEMORY:" +
            initialMemory * WASM_PAGE_SIZE +
            "}";
          const script = argon2LoaderCode.replace(
            /^var Module.*?}/,
            memoryDecl + moduleDecl
          );
          console.log(script);
          const blob = new Blob([script], { type: "application/javascript" });
          const objectUrl = URL.createObjectURL(blob);
          const worker = new Worker(objectUrl);
          const onMessage = e => {
            switch (e.data.op) {
              case "log":
                logger.debug(...e.data.args);
                break;
              case "postRun":
                logger.debug(
                  "WebAssembly runtime loaded (web worker)"
                  //logger.ts(ts)
                );
                URL.revokeObjectURL(objectUrl);
                clearTimeout(loadTimeout);
                worker.removeEventListener("message", onMessage);
                this.runtimeModule = {
                  hash(args) {
                    return new Promise((resolve, reject) => {
                      worker.postMessage(args);
                      const onHashMessage = e => {
                        worker.removeEventListener("message", onHashMessage);
                        worker.terminate();
                        Argon2.runtimeModule = null;
                        if (!e.data || e.data.error || !e.data.hash) {
                          const ex =
                            (e.data && e.data.error) || "unexpected error";
                          logger.error("Worker error", ex);
                          reject(ex);
                        } else {
                          resolve(e.data.hash);
                        }
                      };
                      worker.addEventListener("message", onHashMessage);
                    });
                  }
                };
                resolve(this.runtimeModule);
                break;
              default:
                logger.error("Unknown message", e.data);
                URL.revokeObjectURL(objectUrl);
                reject("Load error");
            }
          };
          worker.addEventListener("message", onMessage);
        } else {
          // Chrome and Electron crash if we use WASM in WebWorker
          // see https://github.com/keeweb/keeweb/issues/1263
          const wasmMemory = new WebAssembly.Memory({
            initial: initialMemory,
            maximum: totalMemory
          });
          global.Module = {
            wasmJSMethod: "native-wasm",
            locateFile: path => {
              return path;
            },
            wasmBinaryFile: "argon2.wasm",
            print(...args) {
              logger.debug(...args);
            },
            printErr(...args) {
              logger.debug(...args);
            },
            postRun: () => {
              logger.debug(
                "WebAssembly runtime loaded (main thread)"
                //logger.ts(ts)
              );
              clearTimeout(loadTimeout);
              resolve({
                hash: args => {
                  const hash = this.calcHash(global.Module, args);
                  global.Module.unloadRuntime();
                  global.Module = undefined;
                  return Promise.resolve(hash);
                }
              });
            },
            wasmMemory,
            buffer: wasmMemory.buffer,
            TOTAL_MEMORY: initialMemory * WASM_PAGE_SIZE
          };
          // eslint-disable-next-line no-eval
          eval(argon2LoaderCode);
        }
      } catch (err) {
        reject(err);
      }
    }).catch(err => {
      logger.warn("WebAssembly error", err);
      throw new Error("WebAssembly error");
    });
  },

  // eslint-disable-next-line object-shorthand
  /* eslint-disable no-restricted-globals */
  workerPostRun: function() {
    self.postMessage({ op: "postRun" });
    self.onmessage = e => {
      try {
        /* eslint-disable-next-line no-undef */
        const hash = Module.calcHash(Module, e.data);
        self.postMessage({ hash });
      } catch (e) {
        self.postMessage({ error: e.toString() });
      }
    };
  },
  /* eslint-enable no-restricted-globals */

  // eslint-disable-next-line object-shorthand
  calcHash: function(Module, args) {
    let { password, salt } = args;
    const { memory, iterations, length, parallelism, type, version } = args;
    const passwordLen = password.byteLength;
    password = Module.allocate(
      new Uint8Array(password),
      "i8",
      Module.ALLOC_NORMAL
    );
    const saltLen = salt.byteLength;
    salt = Module.allocate(new Uint8Array(salt), "i8", Module.ALLOC_NORMAL);
    const hash = Module.allocate(new Array(length), "i8", Module.ALLOC_NORMAL);
    const encodedLen = 512;
    const encoded = Module.allocate(
      new Array(encodedLen),
      "i8",
      Module.ALLOC_NORMAL
    );

    const res = Module._argon2_hash(
      iterations,
      memory,
      parallelism,
      password,
      passwordLen,
      salt,
      saltLen,
      hash,
      length,
      encoded,
      encodedLen,
      type,
      version
    );
    if (res) {
      throw new Error("Argon2 error " + res);
    }
    const hashArr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      hashArr[i] = Module.HEAP8[hash + i];
    }
    Module._free(password);
    Module._free(salt);
    Module._free(hash);
    Module._free(encoded);
    return hashArr;
  }
};

export default Argon2;
