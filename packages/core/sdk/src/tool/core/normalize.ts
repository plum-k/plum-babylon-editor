export function normalize(value: number, min: number, max: number, a: number = 0, b: number = 1): number {
    return a + ((value - min) * (b - a)) / (max - min);
}