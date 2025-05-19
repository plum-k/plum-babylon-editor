import {describe, expect, test} from 'vitest';
import {Extent} from "../../src/geographic/Extent";
import {EPSGCode} from "../../src/geographic/CRS";

describe('Extent', () => {
    test('经纬度取值', () => {
        const Extent = new Extent();
        Extent.set(1, 2, 3);
        expect(Extent.x).toBe(1);
        expect(Extent.y).toBe(2)
        expect(Extent.z).toBe(3)
        expect(Extent.longitude).toBe(1);
        expect(Extent.latitude).toBe(2)
        expect(Extent.altitude).toBe(3)
    });
    test('asArray', () => {
        const Extent = new Extent();
        Extent.set(1, 2, 3);
        expect(Extent.asArray()).toEqual([1, 2, 3])
    });
    test('toString', () => {
        const Extent = new Extent();
        Extent.longitude = 1;
        Extent.latitude = 2;
        Extent.altitude = 3;
        expect(Extent.toString()).toBe("crs: EPSG:4326, x: 1, y: 2, z: 3")
    });

    test('toMercator', () => {
        const Extent = new Extent();
        Extent.longitude = 116.3902;
        Extent.latitude = 39.9016;
        Extent.altitude = 0;
        const _Extent = Extent.toMercator();
        expect(_Extent.x).toBe(12956497.797327269)
        expect(_Extent.y).toBe(4851653.345876037)
        expect(_Extent.z).toBe(0)
    });
    test('toWgs84', () => {
        const Extent = new Extent();
        Extent.setCrs(EPSGCode.MERCATOR)
        Extent.x = 12956497.797327269;
        Extent.y = 4851653.345876037;
        Extent.z = 0;
        const _Extent = Extent.toWgs84();
        expect(_Extent.x).toBe(116.3902)
        // 小数点太多了, 用近似相等
        expect(_Extent.y).toBeCloseTo(39.9016)
        expect(_Extent.z).toBe(0)
    });
    test('toGeodesic', () => {
        const Extent = new Extent();
        Extent.setCrs(EPSGCode.MERCATOR)
        Extent.x = 12956497.797327269;
        Extent.y = 4851653.345876037;
        Extent.z = 0;
        const _Extent = Extent.toGeodesic();
        expect(_Extent.x).toBeCloseTo(-2177838.666159244)
        // 小数点太多了, 用近似相等
        expect(_Extent.y).toBeCloseTo(4389112.369695514)
        expect(_Extent.z).toBeCloseTo(4069609.962610991)
    });
});
