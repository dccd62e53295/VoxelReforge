import * as Util from "./Util.js";


export default class BinaryStream {
    /*
     * why 0x40000000
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/ArrayBuffer#creating_a_resizable_arraybuffer
     */
    static max_size = 0x40000000;

    /** @type {ArrayBuffer} (holder) */
    #buffer = undefined;
    /** @type {DataView<ArrayBuffer>} */
    #dataview = undefined;
    /** @type {Uint8Array<ArrayBuffer>} */
    #chararray = undefined;

    /* uint32_t */
    #offset = 0;
    #length = 0;

    isLE = true;

    #setBuffer(p1) {
        if (!(p1 instanceof ArrayBuffer)) {
            throw new TypeError();
        }
        this.#buffer = p1;
        this.#dataview = new DataView(this.#buffer);
        this.#chararray = new Uint8Array(this.#buffer);
    };

    get rawBuffer() {
        return this.#buffer;
    };

    get rawByte() {
        return this.#chararray;
    };

    get rawData() {
        return this.#dataview;
    };

    get offset() {
        return this.#offset;
    };

    set offset(p1) {
        if ((!Number.isSafeInteger(p1)) || p1 < 0 || p1 > this.#length) {
            throw new RangeError("out of bounds");
        }
        this.#offset = p1;
    };

    get end() {
        return this.#length === this.#offset;
    };

    get remaining() {
        return this.#length - this.#offset;
    };

    /**
     * @param {u32} p1 length
     * @returns {boolean} is_success
     * @throws RangeError if p1 > max_size
     */
    #increaseBufferSize(p1) {
        if (p1 <= this.#length) {
            return false;
        }
        if (p1 > this.#buffer.byteLength) {
            let a = p1;
            if (a > this.constructor.max_size) {
                throw new RangeError("out of bounds");
            }
            if ((this.#buffer.byteLength + 1024) > p1) {
                a += 1024;
            }
            if (a > max_size) {
                a = max_size;
            }
            this.#setBuffer(this.#buffer.transfer(a));
        }
        this.#length = p1;
        return true;
    };

    get length() {
        return this.#length;
    };
    /**
     * @param {ArrayBuffer|i32} p1 content
     * @param {boolean} p2 is_little_endian
     * @param {boolean} p3 do_copy
     */
    constructor(p1, p2 = true, p3 = true) {
        this.offset = 0;
        this.isLE = p2;

        if (0 === p1) {
            this.#setBuffer(new ArrayBuffer(64));
            this.length = 0;
            return;
        }
        if ((typeof p1 === "number") && Number.isSafeInteger(p1) && p1 > 0 && p1 <= max_size) {
            this.#setBuffer(new ArrayBuffer(p1));
            this.length = p1;
            return;
        }

        if (typeof p1 === "string") {
            p3 = true;
            if (p1.match(Util.str_may_hex)) {
                p1 = Uint8Array.fromHex(p1);
            } else if (p1.match(Util.str_may_base64)) {
                p1 = Uint8Array.fromBase64(p1, {
                    lastChunkHandling: "strict",
                    alphabet: "base64"
                });
            } else if (p1.match(Util.str_may_base64url)) {
                p1 = Uint8Array.fromBase64(p1, {
                    lastChunkHandling: "strict",
                    alphabet: "base64url"
                });
            } else {
                throw new TypeError("not a valid string: " + p1);
            }
        }
        if (p1 instanceof Uint8Array) {
            p1 = p1.buffer;
        }
        if (p1 instanceof ArrayBuffer) {
            if (p1.resizable) {
                throw new TypeError("resizable ArrayBuffer not support");
            }
            this.#setBuffer(p3 ? p1.transfer() : p1);
            this.length = this.#buffer.length;
            return;
        }

        //console.error("BinaryStream received unknown value in constructor", p1);
        throw new TypeError("unknown type of value");
    };

    toHex() {
        return this.#chararray.slice(0, this.#length).toHex();
    };

    toBase64() {
        return this.#chararray.slice(0, this.#length).toBase64({
            omitPadding: false,
            alphabet: "base64"
        });
    };

    toBase64() {
        return this.#chararray.slice(0, this.#length).toBase64({
            omitPadding: true,
            alphabet: "base64url"
        });
    };

    clone() {
        const a = new BinaryStream(this.#buffer.slice(0, this.#length), this.isLE, false);
        a.offset = this.#offset;
        return a;
    };

    dispose() {
        const a = this.#buffer.slice(0, this.#length);
        this.#chararray = undefined;
        this.#dataview = undefined;
        this.#buffer = undefined;
        this.#length = 0;
        this.#offset = 0;
        return a;
    };

    /**
     * impl std::stringstream  
     * https://en.cppreference.com/w/cpp/io/basic_stringstream.html
     * */

    eof() {
        return this.end;
    };

    seek(p1) {
        this.offset = p1;
    };

    tell() {
        return this.offset;
    };

    put(p1) {
        if ((!Number.isSafeInteger(p1)) || p1 < 0 || p1 > 255) {
            throw new TypeError("not a byte");
        }
        this.#increaseBufferSize(1 + this.#offset);
        this.#chararray[this.#offset] = p1;
        this.#offset += 1;
    };

    get() {
        if (this.end()) {
            return undefined;
        }
        const a = this.#chararray[this.#offset];
        this.#offset += 1;
        return a;
    };

    write(p1) {
        if (p1 instanceof ArrayBuffer) {
            p1 = new Uint8Array(p1);
        }
        if (!(p1 instanceof Uint8Array)) {
            throw new TypeError();
        }
        const len = p1.length;
        if (len == 0) {
            return;
        }
        this.#increaseBufferSize(len + this.#offset);
        this.#chararray.set(p1, this.#offset);
        this.#offset += len;
    };

    read(p1) {
        if ((!Number.isSafeInteger(p1)) || p1 <= 0) {
            return undefined;
        }
        if ((p1 + this.#offset) > this.#length) {
            return undefined;
        }
        const a = this.#buffer.slice(this.#offset, this.#offset + p1);
        this.#offset += p1;
        return a;
    };

    /**
     * impl Packet Encode / Decode
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects
     */
    /* 1 byte int */
    writeu8(p1) {
        if ((!Number.isSafeInteger(p1)) || p1 < 0 || p1 > 255) {
            throw new TypeError("not a byte");
        }
        this.#increaseBufferSize(1 + this.#offset);
        this.#dataview.setUint8(this.#offset, p1, this.isLE);
        this.#offset += 1;
    };

    readu8() {
        if (this.remaining < 1) {
            return undefined;
        }
        const a = this.#dataview.getUint8(this.#offset, this.isLE);
        this.#offset += 1;
        return a;
    };

    writei8(p1) {
        if ((!Number.isSafeInteger(p1)) || p1 < -128 || p1 > 127) {
            throw new TypeError("not a byte");
        }
        this.#increaseBufferSize(1 + this.#offset);
        this.#dataview.setInt8(this.#offset, p1, this.isLE);
        this.#offset += 1;
    };

    readi8() {
        if (this.remaining < 1) {
            return undefined;
        }
        const a = this.#dataview.getInt8(this.#offset, this.isLE);
        this.#offset += 1;
        return a;
    };
    /* 2 byte int */
    writeu16(p1) {
        if ((!Number.isSafeInteger(p1)) || p1 < 0 || p1 > 65535) {
            throw new TypeError("not a short");
        }
        this.#increaseBufferSize(2 + this.#offset);
        this.#dataview.setUint16(this.#offset, p1, this.isLE);
        this.#offset += 2;
    };

    readu16() {
        if (this.remaining < 2) {
            return undefined;
        }
        const a = this.#dataview.getUint16(this.#offset, this.isLE);
        this.#offset += 2;
        return a;
    };

    writei16(p1) {
        if ((!Number.isSafeInteger(p1)) || p1 < -32768 || p1 > 32767) {
            throw new TypeError("not a short");
        }
        this.#increaseBufferSize(2 + this.#offset);
        this.#dataview.setInt16(this.#offset, p1, this.isLE);
        this.#offset += 2;
    };

    readi8() {
        if (this.remaining < 2) {
            return undefined;
        }
        const a = this.#dataview.getInt16(this.#offset, this.isLE);
        this.#offset += 2;
        return a;
    };
    /* 4 byte int */
    writeu32(p1) {
        if (!Util.is_u32(p1)) {
            throw new TypeError("not a int");
        }
        this.#increaseBufferSize(4 + this.#offset);
        this.#dataview.setUint32(this.#offset, p1, this.isLE);
        this.#offset += 4;
    };

    readu32() {
        if (this.remaining < 4) {
            return undefined;
        }
        const a = this.#dataview.getUint32(this.#offset, this.isLE);
        this.#offset += 4;
        return a;
    };

    writei32(p1) {
        if (!Util.is_i32(p1)) {
            throw new TypeError("not a int");
        }
        this.#increaseBufferSize(4 + this.#offset);
        this.#dataview.setInt32(this.#offset, p1, this.isLE);
        this.#offset += 4;
    };

    readi32() {
        if (this.remaining < 4) {
            return undefined;
        }
        const a = this.#dataview.getInt32(this.#offset, this.isLE);
        this.#offset += 4;
        return a;
    };
    /* 8 byte int ; WARN: bigint type */
    writeu64(p1) {
        if (!Util.is_u64(p1)) {
            throw new TypeError("not a long");
        }
        this.#increaseBufferSize(8 + this.#offset);
        this.#dataview.setUint64(this.#offset, p1, this.isLE);
        this.#offset += 8;
    };

    readu64() {
        if (this.remaining < 8) {
            return undefined;
        }
        const a = this.#dataview.getUint64(this.#offset, this.isLE);
        this.#offset += 8;
        return a;
    };

    writei64(p1) {
        if (!Util.is_i64(p1)) {
            throw new TypeError("not a long");
        }
        this.#increaseBufferSize(8 + this.#offset);
        this.#dataview.setInt64(this.#offset, p1, this.isLE);
        this.#offset += 8;
    };

    readi64() {
        if (this.remaining < 8) {
            return undefined;
        }
        const a = this.#dataview.getInt64(this.#offset, this.isLE);
        this.#offset += 8;
        return a;
    };
    /* 2 byte float */
    writef16(p1) {
        if ((typeof p1 != "number") || p1 < -65504 || p1 > 65504) {
            throw new TypeError("not a f16");
        }
        this.#increaseBufferSize(2 + this.#offset);
        this.#dataview.setFloat16(this.#offset, p1, this.isLE);
        this.#offset += 2;
    };

    readf16() {
        if (this.remaining < 2) {
            return undefined;
        }
        const a = this.#dataview.getFloat16(this.#offset, this.isLE);
        this.#offset += 2;
        return a;
    };
    /* 4 byte float */
    writef32(p1) {
        if ((typeof p1 != "number") || p1 < -3.4e38 || p1 > 3.4e38) {
            throw new TypeError("not a float");
        }
        this.#increaseBufferSize(4 + this.#offset);
        this.#dataview.setFloat32(this.#offset, p1, this.isLE);
        this.#offset += 4;
    };

    readf32() {
        if (this.remaining < 4) {
            return undefined;
        }
        const a = this.#dataview.getFloat32(this.#offset, this.isLE);
        this.#offset += 4;
        return a;
    };
    /* 8 byte float */
    writef64(p1) {
        if (typeof p1 != "number") {
            throw new TypeError("not a double");
        }
        this.#increaseBufferSize(8 + this.#offset);
        this.#dataview.setFloat64(this.#offset, p1, this.isLE);
        this.#offset += 8;
    };

    readf64() {
        if (this.remaining < 8) {
            return undefined;
        }
        const a = this.#dataview.getFloat64(this.#offset, this.isLE);
        this.#offset += 8;
        return a;
    };



};
