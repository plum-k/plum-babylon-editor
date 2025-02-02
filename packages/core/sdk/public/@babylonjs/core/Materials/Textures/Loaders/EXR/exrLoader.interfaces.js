export const INT32_SIZE = 4;
export const FLOAT32_SIZE = 4;
export const INT8_SIZE = 1;
export const INT16_SIZE = 2;
export const ULONG_SIZE = 8;
export const USHORT_RANGE = 1 << 16;
export const BITMAP_SIZE = USHORT_RANGE >> 3;
export const HUF_ENCBITS = 16;
export const HUF_DECBITS = 14;
export const HUF_ENCSIZE = (1 << HUF_ENCBITS) + 1;
export const HUF_DECSIZE = 1 << HUF_DECBITS;
export const HUF_DECMASK = HUF_DECSIZE - 1;
export const SHORT_ZEROCODE_RUN = 59;
export const LONG_ZEROCODE_RUN = 63;
export const SHORTEST_LONG_RUN = 2 + LONG_ZEROCODE_RUN - SHORT_ZEROCODE_RUN;
//# sourceMappingURL=exrLoader.interfaces.js.map