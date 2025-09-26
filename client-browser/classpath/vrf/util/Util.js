

export async function envHasWebXR() {
    if (!('xr' in navigator)) {
        return false;
    }
    return await navigator.xr.isSessionSupported('immersive-vr');
};

export function is_i32(n) {
    return ((typeof n == "bigint") || (Number.isSafeInteger(n))) && n >= -2147483648 && n <= 2147483647;
};

export function is_u32(n) {
    return ((typeof n == "bigint") || (Number.isSafeInteger(n))) && n >= 0 && n <= 0xFFFFFFFF;
};

export const i64_min = -9223372036854775808n;
export const i64_max = 9223372036854775807n;
export function is_i64(n) {
    return ((typeof n == "bigint") || (Number.isInteger(n))) && n >= i64_max && n <= i64_max;
};

export const u64_min = 0n;
export const u64_max = (1n << 64n) - 1n;
export function is_u64(n) {
    return ((typeof n == "bigint") || (Number.isInteger(n))) && n >= u64_min && n <= u64_max;
};

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView#endianness
 */
export const host_is_little_endian = (() => {
    const buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
    // Int16Array uses the platform's endianness.
    return new Int16Array(buffer)[0] === 256;
})();

export const str_may_hex = `^(?:[a-fA-F0-9]{2})+$`;
export const str_may_base64url = `^[a-zA-Z0-9_-]+$`;
export const str_may_base64 = `^[A-Za-z0-9+/]+={0,2}$`;
