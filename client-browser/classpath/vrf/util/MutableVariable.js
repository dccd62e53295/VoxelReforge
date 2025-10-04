
import EventEmitter from "./EventEmitter.js";

export default class MutableVariable extends EventEmitter {
    #disposeEventName = "dispose";
    #value = undefined;

    constructor(val = undefined) {
        super(val);
        this.#value = val;
    };
    /**
     * @param {any} val
     */
    set value(val = undefined) {
        if (val === this.#value) {
            return;
        }
        const eventObj = {
            event:"change",
            old: this.#value,
            new: val,
            entry: this
        };
        this.#value = val;
        this.emit(eventObj);
    };

    get value() {
        return this.#value;
    };

    dispose() {
        this.emit(this.#disposeEventName, {
            event:"dispose",
            old: this.#value,
            entry: this
        });
        super.dispose();
    };

};
