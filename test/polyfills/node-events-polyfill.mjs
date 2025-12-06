import { AsyncResource } from 'async_hooks';
import * as events from 'events';

const kAsyncResource = Symbol('EventEmitterAsyncResource.kAsyncResource');

class EventEmitterReferencingAsyncResource extends AsyncResource {
  constructor(emitter, name, options) {
    super(name ?? 'EventEmitterAsyncResource', options);
    this.eventEmitter = emitter;
  }
}

export class EventEmitterAsyncResource extends events.EventEmitter {
  constructor(options = {}) {
    const resolvedOptions = typeof options === 'string' ? { name: options } : { ...options };
    const name = resolvedOptions.name ?? new.target.name;
    super(resolvedOptions);
    this[kAsyncResource] = new EventEmitterReferencingAsyncResource(this, name, resolvedOptions);
  }

  get asyncResource() {
    const resource = this[kAsyncResource];
    if (resource === undefined) {
      throw new TypeError('EventEmitterAsyncResource not initialized');
    }
    return resource;
  }

  get asyncId() {
    return this.asyncResource.asyncId();
  }

  get triggerAsyncId() {
    return this.asyncResource.triggerAsyncId();
  }

  emit(event, ...args) {
    return this.asyncResource.runInAsyncScope(events.EventEmitter.prototype.emit, this, event, ...args);
  }

  emitDestroy() {
    this.asyncResource.emitDestroy();
  }
}

export {
  EventEmitter,
  once,
  on,
  getEventListeners,
  captureRejectionSymbol,
  captureRejections,
  defaultMaxListeners,
  errorMonitor,
  init,
  listenerCount,
  setMaxListeners,
  usingDomains,
} from 'events';
export { default } from 'events';
