
import RtVar from "./RtVar.js";

export default class RtVars {

    /**
     * Map<string, RtVar>
     */
    #rtVars = new Map();

    #removeIfEmpty(name) {
        let entry = this.#rtVars[name];
        if (!(entry instanceof RtVar)) {
            return false;
        }
        if (!entry.isPureEmpty()) {
            return false;
        }
        entry.dispose();
        this.#rtVars[name] = undefined;
        return true;
    };

    #register(name, value) {
        const entry = new RtVar(this, name, value);
        this.#rtVars[name] = entry;
        return entry;
    };

    reg(name, value = undefined) {
        if (this.#rtVars[name] instanceof RtVar) {
            console.error("registery exist", this, name, value);
            return this.#rtVars[name];
        }
        return this.#register(name, value);
    };

    unreg(name) {
        if (this.#rtVars[name] instanceof RtVar) {
            this.#rtVars[name].dispose();
        }
        this.#rtVars[name] = undefined;
    };

    getVal(name) {
        return this.#rtVars[name].value ?? undefined;
    };

    setVal(name, val) {
        if (this.#rtVars[name] instanceof RtVar) {
            this.#rtVars[name].value = val;
            this.#removeIfEmpty(name);
        } else if (undefined !== val) {
            this.#register(name, val);
        }
    };

    on(name, event, listener) {
        if (!(this.#rtVars[name] instanceof RtVar)) {
            this.#register(name, undefined);
        }
        this.#rtVars[name].onListen(event, listener);
    };

    off(name, event, listener) {
        if (!(this.#rtVars[name] instanceof RtVar)) {
            return;
        }
        this.#rtVars[name].offListen(event, listener);
        if ("change" === event) {
            this.#removeIfEmpty(name);
        }
    };

    dispose() {
        for (const [key, value] of Object.entries(this.#rtVars)) {
            if (value instanceof RtVar) {
                value.dispose();
            }
        }
        this.#rtVars=new Map();
    };

};
