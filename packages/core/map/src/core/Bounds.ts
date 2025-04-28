/**
 * 地图边界类，定义地图的经纬度范围
 */
export class Bounds {
    /**
     * 最小经度
     */
    minLongitude: number;

    /**
     * 最小纬度
     */
    minLatitude: number;

    /**
     * 最大经度
     */
    maxLongitude: number;

    /**
     * 最大纬度
     */
    maxLatitude: number;

    constructor(minLongitude: number, minLatitude: number, maxLongitude: number, maxLatitude: number) {
        this.minLongitude = minLongitude;
        this.minLatitude = minLatitude;
        this.maxLongitude = maxLongitude;
        this.maxLatitude = maxLatitude;
    }
}