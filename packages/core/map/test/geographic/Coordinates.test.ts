import {describe, expect, test} from 'vitest';
import {Coordinates} from "../../src/geographic/Coordinates";
import {EPSGCode} from "../../src/geographic/CRS";

describe('Coordinates', () => {
    test('经纬度取值', () => {
        const coordinates = new Coordinates();
        coordinates.set(1, 2, 3);
        expect(coordinates.x).toBe(1);
        expect(coordinates.y).toBe(2)
        expect(coordinates.z).toBe(3)
        expect(coordinates.longitude).toBe(1);
        expect(coordinates.latitude).toBe(2)
        expect(coordinates.altitude).toBe(3)
    });
    test('asArray', () => {
        const coordinates = new Coordinates();
        coordinates.set(1, 2, 3);
        expect(coordinates.asArray()).toEqual([1, 2, 3])
    });
    test('toString', () => {
        const coordinates = new Coordinates();
        coordinates.longitude = 1;
        coordinates.latitude = 2;
        coordinates.altitude = 3;
        expect(coordinates.toString()).toBe("crs: EPSG:4326, x: 1, y: 2, z: 3")
    });

    test('toMercator', () => {
        const coordinates = new Coordinates();
        coordinates.longitude = 116.3902;
        coordinates.latitude = 39.9016;
        coordinates.altitude = 0;
        const _coordinates = coordinates.toMercator();
        expect(_coordinates.x).toBe(12956497.797327269)
        expect(_coordinates.y).toBe(4851653.345876037)
        expect(_coordinates.z).toBe(0)
    });
    test('toWgs84', () => {
        const coordinates = new Coordinates();
        coordinates.setCrs(EPSGCode.MERCATOR)
        coordinates.x = 12956497.797327269;
        coordinates.y = 4851653.345876037;
        coordinates.z = 0;
        const _coordinates = coordinates.toWgs84();
        expect(_coordinates.x).toBe(116.3902)
        // 小数点太多了, 用近似相等
        expect(_coordinates.y).toBeCloseTo(39.9016)
        expect(_coordinates.z).toBe(0)
    });
    test('toGeodesic', () => {
        const coordinates = new Coordinates();
        coordinates.setCrs(EPSGCode.MERCATOR)
        coordinates.x = 12956497.797327269;
        coordinates.y = 4851653.345876037;
        coordinates.z = 0;
        const _coordinates = coordinates.toGeodesic();
        expect(_coordinates.x).toBeCloseTo(-2177838.666159244)
        // 小数点太多了, 用近似相等
        expect(_coordinates.y).toBeCloseTo(4389112.369695514)
        expect(_coordinates.z).toBeCloseTo(4069609.962610991)
    });
});
