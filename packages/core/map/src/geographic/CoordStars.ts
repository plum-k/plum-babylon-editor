import {Coordinates} from './Coordinates';
import {Vector3} from '@babylonjs/core';

export class SunPositionCalculator {
    private readonly PI = Math.PI;
    private readonly rad = this.PI / 180;
    private readonly dayMs = 1000 * 60 * 60 * 24;
    private readonly J1970 = 2440588;
    private readonly J2000 = 2451545;
    private readonly e = this.rad * 23.4397; // obliquity of the Earth

    constructor() {
    }

    /**
     * 将日期转换为儒略日
     */
    private toJulian(date: Date | number): number {
        return (typeof date === 'number' ? date : date.valueOf()) / this.dayMs - 0.5 + this.J1970;
    }

    /**
     * 计算相对于J2000的天数
     */
    private toDays(date: Date | number): number {
        return this.toJulian(date) - this.J2000;
    }

    /**
     * 计算赤经
     */
    private getRightAscension(l: number, b: number): number {
        return Math.atan2(Math.sin(l) * Math.cos(this.e) - Math.tan(b) * Math.sin(this.e), Math.cos(l));
    }

    /**
     * 计算赤纬
     */
    private getDeclination(l: number, b: number): number {
        return Math.asin(Math.sin(b) * Math.cos(this.e) + Math.cos(b) * Math.sin(this.e) * Math.sin(l));
    }

    /**
     * 计算方位角
     */
    private getAzimuth(H: number, phi: number, dec: number): number {
        return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
    }

    /**
     * 计算高度角
     */
    private getAltitude(H: number, phi: number, dec: number): number {
        return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
    }

    /**
     * 计算恒星时
     */
    private getSiderealTime(d: number, lw: number): number {
        return this.rad * (280.16 + 360.9856235 * d) - lw;
    }

    /**
     * 计算太阳平近点角
     */
    private getSolarMeanAnomaly(d: number): number {
        return this.rad * (357.5291 + 0.98560028 * d);
    }

    /**
     * 计算中心差
     */
    private getEquationOfCenter(M: number): number {
        return this.rad * (1.9148 * Math.sin(M) + 0.0200 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    }

    /**
     * 计算黄经
     */
    private getEclipticLongitude(M: number, C: number): number {
        const P = this.rad * 102.9372; // perihelion of the Earth
        return M + C + P + this.PI;
    }

    /**
     * 计算太阳位置的天文参数
     */
    public calculateAstronomicalParameters(date: Date | number, lat: number, lon: number) {
        const lw = this.rad * -lon;
        const phi = this.rad * lat;
        const d = this.toDays(date);
        const M = this.getSolarMeanAnomaly(d);
        const C = this.getEquationOfCenter(M);
        const L = this.getEclipticLongitude(M, C);
        const D = this.getDeclination(L, 0);
        const A = this.getRightAscension(L, 0);
        const t = this.getSiderealTime(d, lw);
        const H = t - A;

        return {
            eclipticLongitude: L,
            declination: D,
            rightAscension: A,
            hourAngle: H,
            siderealTime: t,
            altitude: this.getAltitude(H, phi, D),
            azimuth: this.getAzimuth(H, phi, D) + this.PI / 2,
        };
    }

    /**
     * 计算太阳在场景中的坐标
     */
    public calculateSunPositionInScene(date: Date | number, lat: number, lon: number): Vector3 {
        const sun = this.calculateAstronomicalParameters(date, lat, lon);
        const dayMilliSec = 24 * 3600000;
        const longitude = sun.rightAscension + ((date instanceof Date ? date.valueOf() : date) % dayMilliSec) / dayMilliSec * -360 + 180;

        const coSunCarto = new Coordinates('EPSG:4326', longitude, lat, 50000000)
            .as('EPSG:4978')
            .toVector3();

        return coSunCarto;
    }
}

// Return scene coordinate ({x,y,z}) of sun
export function getSunPositionInScene(date: Date | number, lat: number, lon: number) {
    if (typeof date !== 'number') {
        date = date.valueOf();
    }
    const sun = new SunPositionCalculator().calculateAstronomicalParameters(date, lat, lon);
    const dayMilliSec = 24 * 3600000;
    const longitude = sun.ascension +
        ((date % dayMilliSec) / dayMilliSec) * -360 + 180; // cause midday
    const coSunCarto = new Coordinates('EPSG:4326', longitude, lat, 50000000)
        .as('EPSG:4978').toVector3();

    return coSunCarto;
}