
import RtVar from "./RtVar.js";

export default class RtVars {
    /**
     * [ string => RtVar ]
     */
    /** @type {Map<string,RtVar>} */
    #values = new Map();

    get values() {
        return this.#values;
    };

    #removeIfEmpty(name) {
        let entry = this.#values.get(name);
        if (!(entry instanceof RtVar)) {
            return false;
        }
        if (!entry.isPureEmpty()) {
            return false;
        }
        entry.dispose();
        this.#values.delete(name);
        return true;
    };

    #register(name, value) {
        const entry = new RtVar(this, name, value);
        this.#values.set(name, entry);
        return entry;
    };

    reg(name, value = undefined) {
        if (this.#values.has(name)) {
            console.error("registery exist", this, name, value);
            return this.#values.get(name);
        }
        return this.#register(name, value);
    };

    unreg(name) {
        if (this.#values.has(name)) {
            this.#values.get(name).dispose();
        }
        this.#values.delete(name);
    };

    getVal(name) {
        return this.#values.get(name).value ?? undefined;
    };

    setVal(name, val) {
        if (this.#values.has(name)) {
            this.#values.get(name).value = val;
            this.#removeIfEmpty(name);
        } else if (undefined !== val) {
            this.#register(name, val);
        }
    };

    on(name, event, listener) {
        if (!(this.#values.has(name))) {
            this.#register(name, undefined);
        }
        this.#values.get(name).onListen(event, listener);
    };

    off(name, event, listener) {
        if (!(this.#values.has(name))) {
            return;
        }
        this.#values.get(name).offListen(event, listener);
        if ("change" === event) {
            this.#removeIfEmpty(name);
        }
    };

    dispose() {
        for (const [key, value] of this.#values) {
            if (value instanceof RtVar) {
                value.dispose();
            }
        }
        this.#values.clear();
    };

};
