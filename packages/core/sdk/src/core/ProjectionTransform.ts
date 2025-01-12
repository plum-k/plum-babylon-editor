import * as turf from "@turf/turf";

/**
 * 地理坐标投影变换
 */
export class ProjectionTransform {
    private centerPoint: Array<number> = [0, 0];

    constructor(center: [number, number] = [0, 0]) {
        // 定义中心经纬度
        const point = turf.point(center);
        this.centerPoint = turf.toMercator(point).geometry.coordinates
    }

    // 将经纬度投影到平面坐标
    project(lon: number, lat: number) {
        const point = turf.point([lon, lat]);
        let mercator = turf.toMercator(point);

        mercator.geometry.coordinates[0] -= this.centerPoint[0];
        mercator.geometry.coordinates[1] -= this.centerPoint[1];
        return mercator.geometry.coordinates;
    }

    // 将平面坐标转换为经纬度
    invert(x: number, y: number) {
    }
}