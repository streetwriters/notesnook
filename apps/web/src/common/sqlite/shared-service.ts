/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import SharedWorker from "./shared-service.worker.ts?sharedworker";
import { Mutex } from "async-mutex";

const sharedWorker = globalThis.SharedWorker
  ? new SharedWorker({
      name: "SharedService"
    })
  : null;

export class SharedService<T extends object> extends EventTarget {
  #clientId: Promise<string>;

  // This BroadcastChannel is used for client messaging. The provider
  // must have a separate BroadcastChannel in case the instance is
  // both client and provider.
  #clientChannel = new BroadcastChannel("SharedService");

  #onDeactivate?: AbortController | null = null;
  #onClose: AbortController = new AbortController();

  // This is client state to track the provider. The provider state is
  // mostly managed within activate().
  #providerPort?: Promise<MessagePort | null>;
  #providerPortMutex = new Mutex();
  providerCallbacks: Map<
    string,
    {
      resolve: (result: unknown) => void;
      reject: (reason: unknown) => void;
      nonce: string;
      method: string | symbol;
      args: any[];
    }
  > = new Map();
  #providerCounter = 0;
  #providerChangeCleanup: (() => void)[] = [];
  #providerId?: string;

  proxy: T;

  constructor(private readonly serviceName: string) {
    super();

    this.#clientId = this.#getClientId();

    // Connect to the current provider and future providers.
    this.#clientChannel.addEventListener(
      "message",
      async ({ data }) => {
        console.log("got message from provider", data);
        if (
          data?.type === "provider" &&
          data?.sharedService === this.serviceName &&
          data?.providerId !== this.#providerId
        ) {
          this.#providerId = data.providerId;
          // A context (possibly this one) announced itself as the new provider.
          // Discard any old provider and connect to the new one.
          this.#providerPort?.then((port) => port?.close());
          this.#providerPort = this.#providerChange();
          this.#providerPortMutex.release();
          await this.#resendPendingCallbacks();
        }
      },
      { signal: this.#onClose.signal }
    );
    this.#clientChannel.postMessage({
      type: "client",
      sharedService: this.serviceName
    });
    this.#providerPortMutex.acquire();

    window.addEventListener("beforeunload", () => {
      this.close();
    });

    this.proxy = this.#createProxy();
  }

  activate(
    portProviderFunc: () => Promise<{ port: MessagePort; onclose: () => void }>,
    onClientConnected: () => Promise<void>
  ) {
    if (this.#onDeactivate) return;
    // When acquire a lock on the service name then we become the service
    // provider. Only one instance at a time will get the lock; the rest
    // will wait their turn.
    this.#onDeactivate = new AbortController();

    const LOCK_NAME = `SharedService-${this.serviceName}`;
    navigator.locks
      .request(LOCK_NAME, { signal: this.#onDeactivate.signal }, async () => {
        console.time("getting provider port");
        // Get the port to request client ports.
        const { port, onclose } = await portProviderFunc();
        port.start();
        console.timeEnd("getting provider port");

        // Listen for client requests. A separate BroadcastChannel
        // instance is necessary because we may be serving our own
        // request.
        const providerId = await this.#clientId;
        const broadcastChannel = new BroadcastChannel("SharedService");

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const thisArg = this;
        broadcastChannel.addEventListener(
          "message",
          async function onMessage(event) {
            const { data } = event;
            if (
              data?.type === "client" &&
              data?.sharedService === thisArg.serviceName
            ) {
              broadcastChannel.postMessage({
                type: "provider",
                sharedService: data?.sharedService,
                providerId
              });
            }

            if (
              data?.type === "request" &&
              data?.sharedService === thisArg.serviceName
            ) {
              // Get a port to send to the client.
              const requestedPort = await new Promise<MessagePort>(
                (resolve) => {
                  port.addEventListener(
                    "message",
                    (event) => resolve(event.ports[0]),
                    { once: true }
                  );
                  port.postMessage(data.clientId);
                }
              );

              if (data.clientId !== providerId) {
                await onClientConnected();
              }

              try {
                thisArg.#sendPortToClient(data, requestedPort);
              } catch (e) {
                console.error(e, providerId, data);
                // retry if port has been neutered, this can happen when
                // closing the provider tab/window
                if (e instanceof Error && e.message.includes("neutered")) {
                  console.warn("Retrying in 100ms...");
                  await new Promise((resolve) => setTimeout(resolve, 100));
                  onMessage.bind(broadcastChannel, event)();
                } else throw e;
              }
            }
          },
          { signal: this.#onDeactivate?.signal }
        );

        console.log("sending message to clients", providerId, this.serviceName);
        // Tell everyone that we are the new provider.
        broadcastChannel.postMessage({
          type: "provider",
          sharedService: this.serviceName,
          providerId
        });

        // Release the lock only on user abort or context destruction.
        return new Promise((_, reject) => {
          this.#onDeactivate?.signal.addEventListener("abort", () => {
            onclose();
            broadcastChannel.close();
            reject(this.#onDeactivate?.signal.reason);
          });
        });
      })
      .catch(console.error);
  }

  deactivate() {
    this.#onDeactivate?.abort();
    this.#onDeactivate = null;
  }

  close() {
    for (const { reject } of this.providerCallbacks.values()) {
      reject(new Error("SharedService closed."));
    }
    this.deactivate();
    this.#onClose.abort();
  }

  #sendPortToClient(message: any, port: MessagePort) {
    if (!sharedWorker)
      throw new Error("Shared worker is not supported in this environment.");
    sharedWorker.port.postMessage(message, [port]);
  }

  async #getClientId() {
    console.time("getting client id");
    // Use a Web Lock to determine our clientId.
    const nonce = Math.random().toString();
    const clientId = await navigator.locks.request(nonce, async () => {
      console.log("got clientid lock");
      const { held } = await navigator.locks.query();
      return held?.find((lock) => lock.name === nonce)?.clientId;
    });

    // Acquire a Web Lock named after the clientId. This lets other contexts
    // track this context's lifetime.
    // TODO: It would be better to lock on the clientId+serviceName (passing
    // that lock name in the service request). That would allow independent
    // instance lifetime tracking.
    await SharedService.#acquireContextLock(clientId);

    // Configure message forwarding via the SharedWorker. This must be
    // done after acquiring the clientId lock to avoid a race condition
    // in the SharedWorker.
    sharedWorker?.port.addEventListener("message", (event) => {
      event.data.ports = event.ports;
      this.dispatchEvent(new MessageEvent("message", { data: event.data }));
    });
    sharedWorker?.port.start();
    sharedWorker?.port.postMessage({ clientId });

    console.timeEnd("getting client id");
    return clientId;
  }

  async #providerChange() {
    // Multiple calls to this function could be in flight at once. If that
    // happens, we only care about the most recent call, i.e. the one
    // assigned to this.#providerPort. This counter lets us determine
    // whether this call is still the most recent.
    const providerCounter = ++this.#providerCounter;

    // Obtain a MessagePort from the provider. The request can fail during
    // a provider transition, so retry until successful.
    let providerPort: MessagePort | null = null;
    const clientId = await this.#clientId;
    while (!providerPort && providerCounter === this.#providerCounter) {
      // Broadcast a request for the port.
      const nonce = randomString();

      this.#clientChannel.postMessage({
        type: "request",
        nonce,
        sharedService: this.serviceName,
        clientId
      });

      // Wait for the provider to respond (via the service worker) or
      // timeout. A timeout can occur if there is no provider to receive
      // the broadcast or if the provider is too busy.
      const providerPortReady = new Promise<MessagePort>((resolve) => {
        const abortController = new AbortController();
        this.addEventListener(
          "message",
          (event) => {
            if (event instanceof MessageEvent && event.data?.nonce === nonce) {
              resolve(event.data.ports[0]);
              abortController.abort();
            }
          },
          { signal: abortController.signal }
        );
        this.#providerChangeCleanup.push(() => abortController.abort());
      });

      providerPort = await providerPortReady;

      if (!providerPort) {
        // The provider request timed out. If it does eventually arrive
        // just close it.
        providerPortReady.then((port) => {
          console.warn("port arrived but timed out. Closing", port);
          port?.close();
        });
      }
    }

    if (providerPort && providerCounter === this.#providerCounter) {
      // Clean up all earlier attempts to get the provider port.
      this.#providerChangeCleanup.forEach((f) => f());
      this.#providerChangeCleanup = [];

      // Configure the port.
      providerPort.addEventListener("message", ({ data }) => {
        const callbacks = this.providerCallbacks.get(data.nonce);
        if (!callbacks) return;
        if (!data.error) {
          callbacks.resolve(data.result);
        } else {
          callbacks.reject(data.error);
        }
      });
      providerPort.addEventListener("messageerror", console.error);
      providerPort.start();
      return providerPort;
    } else {
      // Either there is no port because this request timed out, or there
      // is a port but it is already obsolete because a new provider has
      // announced itself.
      providerPort?.close();
      return null;
    }
  }

  async #resendPendingCallbacks() {
    const port = await this.getProviderPort();
    for (const { method, args, nonce } of this.providerCallbacks.values()) {
      port.postMessage({ nonce, method, args });
    }
  }

  #createProxy() {
    return new Proxy<T>({} as T, {
      get: (_, method) => {
        return async (...args: any[]) => {
          // Use a nonce to match up requests and responses. This allows
          // the responses to be out of order.
          const nonce = randomString();

          const providerPort = await this.getProviderPort();
          return new Promise((resolve, reject) => {
            this.providerCallbacks.set(nonce, {
              resolve,
              reject,
              nonce,
              method,
              args
            });
            providerPort.postMessage({ nonce, method, args });
          }).finally(() => {
            this.providerCallbacks.delete(nonce);
          });
        };
      }
    });
  }

  static #acquireContextLock = (function () {
    let p: Promise<void> | undefined = undefined;
    return function (clientId: string) {
      return p
        ? p
        : (p = new Promise<void>((resolve) => {
            navigator.locks.request(
              clientId,
              () =>
                new Promise((_) => {
                  resolve();
                })
            );
          }));
    };
  })();

  async getProviderPort() {
    await this.#providerPortMutex.waitForUnlock();

    let tries = 0;
    let providerPort = await this.#providerPort;
    while (!providerPort) {
      if (++tries > 10)
        throw new Error("Could not find a provider port to communicate with.");

      providerPort = await this.#providerPort;
      console.warn(
        "Provider port not found. Retrying in 50ms...",
        this.#providerPort
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return providerPort;
  }
}

/**
 * Wrap a target with MessagePort for proxying.
 */
export function createSharedServicePort(target: any) {
  const { port1: providerPort1, port2: providerPort2 } = new MessageChannel();
  providerPort1.addEventListener("message", ({ data: clientId }) => {
    const { port1, port2 } = new MessageChannel();

    // The port requester holds a lock while using the channel. When the
    // lock is released by the requester, clean up the port on this side.
    navigator.locks.request(clientId, () => {
      port1.close();
    });

    port1.addEventListener("message", async ({ data }) => {
      try {
        port1.postMessage({
          nonce: data.nonce,
          result: await target[data.method](...data.args)
        });
      } catch (e) {
        console.error(e);
        port1.postMessage({
          nonce: data.nonce,
          error: e
        });
      }
    });
    port1.start();
    providerPort1.postMessage(null, [port2]);
  });
  providerPort1.start();
  return providerPort2;
}

function randomString() {
  return Math.random().toString(36).replace("0.", "");
}
