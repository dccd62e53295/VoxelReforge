
export default class AbstractEventEmitter {
    /**
     * @type {Map<string,((args:any)=>void|Promise<void>)[]>}
     */
    events = new Map();
    constructor() {
        this.on = this.on.bind(this);
        this.off = this.off.bind(this);
    };
    /**
     * 
     * @param {string} name 
     * @returns {((args:any)=>void|Promise<void>)[]}
     */
    getListenersByName(name) {
        return this.events.get(name);
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
        let listeners = this.events.get(event);
        if (!Array.isArray(listeners)) {
            listeners = [];
            this.events.set(event, listeners);
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
    emit(event, args) { throw new EvalError("AbstractEventEmitter.emit not implement"); };
    /**
     * @param {string} event 
     * @param {(args:any)=>void|Promise<void>} listener 
     * @returns {void}
     */
    off(event, listener) {
        if (typeof listener != "function") {
            return;
        }
        let listeners = this.events.get(event);
        if ((!Array.isArray(listeners)) || listeners.length === 0) {
            return;
        }
        const index = listeners.indexOf(listener);
        if (index === - 1) {
            return;
        }
        listeners.splice(index, 1);
        if (listeners.length === 0) {
            this.events.delete(event);
        }
    };

    clear() {
        this.events.clear();
    };

};
