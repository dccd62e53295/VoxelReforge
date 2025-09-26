
export default class SyncEventEmitter {
    events = {};// string => function[]
    constructor() {
        this.on = this.on.bind(this);
        this.emit = this.emit.bind(this);
        this.off = this.off.bind(this);
    }
    on(event, listener) {
        if (!Array.isArray(this.events[event])) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    emit(event, args) {
        this.events[event]?.forEach(listener => listener(args));
    }
    off(event, listener) {
        this.events[event] = this.events[event]?.filter(l => l !== listener);
    }
};
