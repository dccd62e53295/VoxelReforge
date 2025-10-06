
import SimpleEventEmitter from "./SimpleEventEmitter.js";
import EventEmitter from "./EventEmitter.js";
import MutableVariable from "./MutableVariable.js";
import TransitVariable from "./TransitVariable.js";

export default class RtVars {
    /** @type {{[K in string]:(EventEmitter|SimpleEventEmitter|object)}} */
    #values = {};
    /** @type {Set<TransitVariable>} */
    #tickables = new Set();


    get values() {
        return this.#values;
    };

    #register(name, type, value = undefined) {
        if (typeof type == "string") {
            switch (type) {
                case 1:
                case "e":
                case "ev":
                case "event":
                    type = SimpleEventEmitter;
                    break;
                case 2:
                case "em":
                    type = EventEmitter;
                    break;
                case 3:
                case "v":
                case "var":
                case "variable":
                    type = MutableVariable;
                    break;
                case 4:
                case "t":
                case "tran":
                case "transit":
                    type = TransitVariable;
                    break;
                default:
                    throw new TypeError("invalid type: " + type);
            }
        }
        const entry = new type(value);
        this.#values[name] = entry;
        if ("animate" in entry) {
            this.#tickables.add(entry);
        }
        return entry;
    };

    reg(name, type, value = undefined) {
        if (undefined !== this.#values[name]) {
            console.error("registery exist", this, name, value);
            return this.#values[name];
        }
        return this.#register(name, type, value);
    };

    unreg(name) {
        const entry = this.#values[name];
        if (undefined !== entry) {
            entry.dispose();
        }
        this.#tickables.delete(entry);
        delete this.#values[name];
    };

    v(name) {
        return this.#values[name] ?? undefined;
    };

    dispose() {
        this.#tickables.clear();
        for (const [k, v] of Object.entries(this.#values)) {
            v.dispose();
        }
        this.#values = {};
    };

    animate(i) {
        for (const entry of this.#tickables) {
            entry.animate(i);
        }
    };

};
