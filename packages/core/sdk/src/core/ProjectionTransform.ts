import * as d3 from 'd3-geo';

// 定义投影类型的枚举
export enum ProjectionType {
    MERCATOR ,
    EQUIRECTANGULAR ,
    ORTHOGRAPHIC ,
};

/**
 * 地理坐标投影变换
 */
export class ProjectionTransform {
    projection: d3.GeoProjection;

    constructor(projectionType = ProjectionType.MERCATOR, scale = 1000, translate: [number, number] = [0, 0]) {
        // 根据传入的类型创建投影
        switch (projectionType) {
            case ProjectionType.MERCATOR:
                this.projection = d3.geoMercator();
                break;
            case ProjectionType.EQUIRECTANGULAR:
                this.projection = d3.geoEquirectangular();
                break;
            case ProjectionType.ORTHOGRAPHIC:
                this.projection = d3.geoOrthographic();
                break;
            default:
                throw new Error('Unsupported projection type');
        }

        this.projection.scale(scale).translate(translate);
    }

    // 将经纬度投影到平面坐标
    project(lon: number, lat: number) {
        const point = this.projection([lon, lat]);
        if (point) {
            const x = point[0];
            const y = point[1];
            return {x, y};
        }
        return {x: 0, y: 0};
    }

    // 设置缩放比例
    setScale(scale: number) {
        this.projection.scale(scale);
    }

    // 设置平面坐标的原点
    setTranslate(point: [number, number]) {
        this.projection.translate(point);
    }
}