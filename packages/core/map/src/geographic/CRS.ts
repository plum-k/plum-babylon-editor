import type {ProjectionDefinition} from 'proj4';
import proj4 from 'proj4';

export enum EPSGCode {
    WGS84 = 'EPSG:4326',          // WGS84 经纬度坐标系
    GEOCENTRIC = 'EPSG:4978', // WGS84 地心坐标系（X,Y,Z）
    MERCATOR = 'EPSG:3857'    // Web Mercator 投影（用于网络地图）
}

// 定义地心坐标系         地心坐标系  以wgs84为基准面   单位为米
// 就是 三维笛卡尔（米） 原点: 地球质心
proj4.defs(EPSGCode.GEOCENTRIC, '+proj=geocent +datum=WGS84 +units=m +no_defs');
// 轴顺序  [经度, 纬度] ->  [纬度, 经度] = latitude, longitude
// proj4.defs(EPSGCode.WGS84).axis = 'neu';


/**
 * 单位类型枚举
 */
export enum UNIT {
    /**
     * 角度单位：度
     */
    DEGREE = 1,
    /**
     * 距离单位：米
     */
    METER = 2,
    /**
     * 距离单位：英尺
     */
    FOOT = 3
}

const projectionCache: Record<string, Record<string, proj4.Converter>> = {};

export class CRS {
    static proj4cache(crsIn: string, crsOut: string): proj4.Converter {
        if (!projectionCache[crsIn]) {
            projectionCache[crsIn] = {};
        }

        if (!projectionCache[crsIn][crsOut]) {
            projectionCache[crsIn][crsOut] = proj4(crsIn, crsOut);
        }

        return projectionCache[crsIn][crsOut];
    }

    static unitFromProj4Unit(proj: ProjectionDefinition) {
        if (proj.units === 'degrees') {
            return UNIT.DEGREE;
        } else if (proj.units === 'm' || proj.units === 'meter') {
            return UNIT.METER;
        } else if (proj.units === 'foot') {
            return UNIT.FOOT;
        } else if (proj.units === undefined && proj.to_meter === undefined) {
            // See https://proj.org/en/9.4/usage/projections.html [17/10/2024]
            // > The default unit for projected coordinates is the meter.
            return UNIT.METER;
        } else {
            return undefined;
        }
    }

    static is4326(crs: string) {
        return crs === EPSGCode.WGS84;
    }

    /**
     * Returns the horizontal coordinates system units associated with this CRS.
     *
     * @param crs - The CRS to extract the unit from.
     * @returns Either `UNIT.METER`, `UNIT.DEGREE`, `UNIT.FOOT` or `undefined`.
     */
    static getUnit(crs: string) {
        const p = proj4.defs(crs);
        if (!p) {
            return undefined;
        }
        return CRS.unitFromProj4Unit(p);
    }

    /**
     * Asserts that the CRS is using metric units.
     *
     * @param crs - The CRS to check.
     * @throws {@link Error} if the CRS is not valid.
     */
    static isMetricUnit(crs: string) {
        return CRS.getUnit(crs) === UNIT.METER;
    }

    /**
     * Asserts that the CRS is geographic.
     *
     * @param crs - The CRS to check.
     * @throws {@link Error} if the CRS is not valid.
     */
    static isGeographic(crs: string) {
        return CRS.getUnit(crs) === UNIT.DEGREE;
    }

    /**
     * Asserts that the CRS is geocentric.
     *
     * @param crs - The CRS to test.
     * @returns false if the crs isn't defined.
     */
    static isGeocentric(crs: string) {
        const projection = proj4.defs(crs);
        return !projection ? false : projection.projName == 'geocent';
    }

    /**
     * Asserts that the CRS is valid, meaning it has been previously defined and
     * includes an unit.
     *
     * @param crs - The CRS to test.
     * @throws {@link Error} if the crs is not valid.
     */
    static isValid(crs: string) {
        const proj = proj4.defs(crs);
        if (!proj) {
            throw new Error(`Undefined crs '${crs}'. Add it with proj4.defs('${crs}', string)`);
        }
        if (!CRS.unitFromProj4Unit(proj)) {
            throw new Error(`No valid unit found for crs '${crs}', found ${proj.units}`);
        }
    }

    /**
     * Gives a reasonable epsilon for this CRS.
     *
     * @param crs - The CRS to use.
     * @returns 0.01 if the CRS is EPSG:4326, 0.001 otherwise.
     */
    static reasonableEpsilon(crs: string) {
        if (crs === EPSGCode.WGS84) {
            return 0.01;
        } else {
            return 0.001;
        }
    }

    /**
     * Returns the axis parameter defined in proj4 for the provided crs.
     * Might be undefined depending on crs definition.
     *
     * @param crs - The CRS to get axis from.
     * @returns the matching proj4 axis string, 'enu' for instance (east, north, up)
     */
    static axisOrder(crs: string) {
        const projection = proj4.defs(crs);
        return !projection ? undefined : projection.axis;
    }

    /**
     * Defines a proj4 projection as a named alias.
     * This function is a specialized wrapper over the
     * [`proj4.defs`](https://github.com/proj4js/proj4js#named-projections)
     * function.
     *
     * @param code - Named alias of the currently defined projection.
     * @param proj4def - Proj4 or WKT string of the defined projection.
     */
    static defs(code: string, proj4def: string) {
        return proj4.defs(code, proj4def)
    }
}

