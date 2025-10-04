

export default class SimpleEventEmitter {
    /**
     * @type {((args:any)=>void|Promise<void>)[]}
     */
    listeners = [];
    constructor(_ = undefined) {
        this.on = this.on.bind(this);
        this.off = this.off.bind(this);
        this.emit = this.emit.bind(this);
    };
    /**
     * @param {(args:any)=>void|Promise<void>} listener 
     * @returns {void}
     */
    on(listener) {
        if (typeof listener != "function") {
            return;
        }
        if (this.listeners.indexOf(listener) !== - 1) {
            return;
        }
        this.listeners.push(listener);
    };
    /**
     * @abstract
     * @param {any} args 
     * @returns {void|Promise<void>}
     */
    emit(args) {
        const result = this.listeners
            .map(listener => listener(args))
            .filter(result => result instanceof Promise);

        if (result.length > 0) {
            return Promise.all(result);
        }
    };
    /**
     * @param {(args:any)=>void|Promise<void>} listener 
     * @returns {void}
     */
    off(listener) {
        if (typeof listener != "function") {
            return;
        }
        const index = this.listeners.indexOf(listener);
        if (index === - 1) {
            return;
        }
        this.listeners.splice(index, 1);
    };

    dispose() {
        this.events = [];
    };

};
