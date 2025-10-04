
import MutableVariable from "./MutableVariable.js";

export default class TransitVariable extends MutableVariable {
    /**
     * @type {(vars:TransitVariable,val:any)=>any}
     */
    #schedule = undefined;
    #interval = -1;// frequency in ms
    #taskid = -1;// setInterval task id

    constructor(val = undefined) {
        super(val);
        this.onRun = this.onRun.bind(this);
    };

    hasSchedule() {
        return -1 !== this.#taskid;
    };

    cancelSchedule() {
        if (-1 !== this.#taskid) {
            clearInterval(this.#taskid);
            this.#taskid = -1;
        }
        this.#interval = -1;
        this.#schedule = undefined;
    };

    onRun() {
        if (undefined === this.#schedule) {
            this.cancelSchedule();
            return;
        }
        super.value = this.#schedule(this, super.value);
    };

    setSchedule(schedule, interval) {
        if (interval < 1) {
            throw new TypeError("invalid interval: " + interval);
        }
        if (-1 !== this.#taskid) {
            this.cancelSchedule();
        }
        this.#schedule = schedule;
        this.#interval = interval;
        this.#taskid = setInterval(this.onRun, this.#interval);
    };

    dispose() {
        this.cancelSchedule();
        super.dispose();
    };
};
