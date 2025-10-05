
export default class EventEmitter {
    /**
     * @type {{[K in string]:((args:any)=>void|Promise<void>)[]}}
     */
    events = {};
    constructor(_ = undefined) {
        this.on = this.on.bind(this);
        this.off = this.off.bind(this);
        this.emit = this.emit.bind(this);
    };
    /**
     * @param {string} event 
     * @param {(args:any)=>void|Promise<void>} listener 
     * @returns {void}
     */
    on(event, listener) {
        if (typeof listener != "function") {
            return;
        }
        let listeners = this.events[event];
        if (!Array.isArray(listeners)) {
            listeners = [];
            this.events[event] = listeners;
        }
        if (listeners.indexOf(listener) !== - 1) {
            return;
        }
        listeners.push(listener);
    };
    /**
     * @abstract
     * @param {string} event 
     * @param {any} args 
     * @returns {void|Promise<void>}
     */
    emit(event, args) {
        if(typeof event!=="string"){
            throw new TypeError("emit event type must string");
        }
        const listeners = this.events[event];
        if ((!Array.isArray(listeners)) || listeners.length === 0) {
            return;
        }
        args.by=this;
        const result = listeners
            .map(listener => listener(args))
            .filter(result => result instanceof Promise);

        if (result.length > 0) {
            return Promise.all(result);
        }
    };
    /**
     * @param {string} event 
     * @param {(args:any)=>void|Promise<void>} listener 
     * @returns {void}
     */
    off(event, listener) {
        if (typeof listener != "function") {
            return;
        }
        let listeners = this.events[event];
        if ((!Array.isArray(listeners)) || listeners.length === 0) {
            return;
        }
        const index = listeners.indexOf(listener);
        if (index === - 1) {
            return;
        }
        listeners.splice(index, 1);
        if (listeners.length === 0) {
            delete this.events[event];
        }
    };

    dispose() {
        this.events = {};
    };

};
