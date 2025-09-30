import AbstractEventEmitter from "./AbstractEventEmitter.js";

export default class SyncEventEmitter extends AbstractEventEmitter{
    constructor() {
        super();
        this.emit = this.emit.bind(this);
    };
    async emit(event, args) {
        const listeners = this.getListenersByName(event);
        if ((!Array.isArray(listeners)) || listeners.length === 0) {
            return;
        }
        listeners.forEach(listener => listener(args));
    };
};
