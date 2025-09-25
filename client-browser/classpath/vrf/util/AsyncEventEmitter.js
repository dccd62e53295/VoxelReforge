
export default class AsyncEventEmitter {
    events = {};
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
    async emit(event, args) {
        const promises = this.events[event]?.map(listener => listener(args)) || [];
        await Promise.all(promises);
    }
    off(event, listener) {
        this.events[event] = this.events[event]?.filter(l => l !== listener);
    }
};
