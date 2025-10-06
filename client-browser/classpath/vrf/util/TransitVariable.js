
import MutableVariable from "./MutableVariable.js";

export default class TransitVariable extends MutableVariable {
    /**
     * @type {(vars:TransitVariable,number,val:any)=>{next:any,end:boolean}}
     */
    #schedule = undefined;

    constructor(val = undefined) {
        super(val);
        this.onRun = this.animate.bind(this);
    };

    /**
     * @type {void|((TransitVariable,number,any)=>{next:any,end:boolean})} schedule
     */
    set schedule(schedule) {
        if (undefined !== this.#schedule) {
            this.#cancelSchedule();
        }
        if (undefined === schedule) {
            return;
        }
        this.#schedule = schedule;
        this.emit("transit_start", {
            event: "transit_start",
            transit: this.#schedule,
            old: this.value
        });
    };

    get schedule() {
        return this.#schedule;
    };

    #cancelSchedule() {
        this.#schedule = undefined;
        this.emit("transit_end", {
            event: "transit_end",
            new: this.value
        });
    };

    animate(i) {
        if (typeof this.#schedule !== "function") {
            return;
        }
        const j = this.#schedule(this, i, this.value);
        this.value = j.next;
        if (j.end) {
            this.#cancelSchedule();
        }
    };

    dispose() {
        this.#cancelSchedule();
        super.dispose();
    };
};
