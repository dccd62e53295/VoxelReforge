import EventEmitter from "./EventEmitter.js";


export default class RtVar {
    #value = undefined;// T
    #listener = new EventEmitter();

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

export class RtVars {
    /**
     * [ string => RtVar ]
     */
    #values = {};

    #removeIfEmpty(name) {
        let entry = this.#values[name];
        if (!(entry instanceof RtVar)) {
            return false;
        }
        if (!entry.isPureEmpty()) {
            return false;
        }
        entry.dispose();
        this.#values[name] = undefined;
        return true;
    }

    #register(name, value) {
        const entry = new RtVar(this, name, value);
        this.#values[name] = entry;
        return entry;
    };

    reg(name, value = undefined) {
        if (this.#values[name] instanceof RtVar) {
            console.error("registery exist", this, name, value);
            return this.#values[name];
        }
        return this.#register(name, value);
    };

    unreg(name) {
        if (this.#values[name] instanceof RtVar) {
            this.#values[name].dispose();
        }
        this.#values[name] = undefined;
    };

    getVal(name) {
        return this.#values[name].value ?? undefined;
    };

    setVal(name, val) {
        if (this.#values[name] instanceof RtVar) {
            this.#values[name].value = val;
            this.#removeIfEmpty(name);
        } else if (undefined !== val) {
            this.#register(name, val);
        }
    }

    on(name, event, listener) {
        if (!(this.#values[name] instanceof RtVar)) {
            this.#register(name, undefined);
        }
        this.#values[name].onListen(event, listener);
    }

    off(name, event, listener) {
        if (!(this.#values[name] instanceof RtVar)) {
            return;
        }
        this.#values[name].offListen(event, listener);
        if ("change" === event) {
            this.#removeIfEmpty(name);
        }
    }

    dispose() {
        for (const [key, value] of Object.entries(this.#values)) {
            if (value instanceof RtVar) {
                value.dispose();
            }
        }
        this.#values = {};
    }
};
