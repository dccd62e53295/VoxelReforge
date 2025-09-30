import AbstractEventEmitter from "./AbstractEventEmitter.js";

export default class AsyncEventEmitter extends AbstractEventEmitter{
    constructor() {
        super();
        this.emit = this.emit.bind(this);
    };
    async emit(event, args) {
        const listeners = this.getListenersByName(event);
        if ((!Array.isArray(listeners)) || listeners.length === 0) {
            return;
        }
        const promises = listeners.map(listener => listener(args)) || [];
        if (promises.length > 0) {
            await Promise.all(promises);
        }
    };
};
