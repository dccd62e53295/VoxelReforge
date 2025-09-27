import SyncEventEmitter from "./SyncEventEmitter.js";


export default class RtVar {
    #value = undefined;// T
    #listener = new SyncEventEmitter();

    onListen = undefined;
    offListen = undefined;

    #parent = undefined;
    #name = "";

    get parent(){
        return this.#parent;
    };

    get name(){
        return this.#name;
    };

    constructor(parent, name, val = undefined) {
        this.#parent = parent;
        this.#name = name;
        this.#value = val;
        this.onListen = this.#listener.on;
        this.offListen = this.#listener.off;
    };
    /**
     * @param {any} val
     */
    set value(val = undefined) {
        if (val === this.#value) {
            return;
        }
        const eventObj = {
            old: this.#value,
            new: val,
            entry: this
        };
        this.#value = val;
        this.#listener.emit("change", eventObj);
    };

    get value() {
        return this.#value;
    };

    isValueEmpty() {
        if ([undefined, null, ""].includes(this.#value)) {
            return true;
        }
        if (Array.isArray(this.#value) && 0 === this.#value.length) {
            return true;
        }
        return false;
    }

    isListenerEmpty() {
        if (this.#listener.events["change"].length > 0) {
            return false;
        }
        // no test "remove" event
        return true;
    }

    isPureEmpty() {
        return this.isValueEmpty() && this.isListenerEmpty();
    }

    dispose() {
        const eventObj = {
            old: this.#value,
            entry: this
        };
        this.#listener.emit("remove", eventObj);
    };

};
