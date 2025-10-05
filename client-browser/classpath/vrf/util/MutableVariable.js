
import EventEmitter from "./EventEmitter.js";

export default class MutableVariable extends EventEmitter {
    #disposeEventName = "dispose";
    #value = undefined;

    valueEquals=(owner,vold,vnew)=>{
        return vold===vnew;
    };

    constructor(val = undefined) {
        super(val);
        this.#value = val;
    };
    /**
     * @param {any} val
     */
    set value(val = undefined) {
        if (this.valueEquals(this,this.#value,val)) {
            return;
        }
        const eventObj = {
            event:"change",
            old: this.#value,
            new: val
        };
        this.#value = val;
        this.emit("change",eventObj);
    };

    get value() {
        return this.#value;
    };

    dispose() {
        this.emit(this.#disposeEventName, {
            event:"dispose",
            old: this.#value
        });
        super.dispose();
    };

};
