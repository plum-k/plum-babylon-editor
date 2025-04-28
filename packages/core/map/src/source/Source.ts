import {ProjectionType, SourceType} from "../enum";
import {Bounds} from "../core";

export interface ISourceOptions {
    /**
     * 最小缩放级别
     */
    minLevel: number;

    /**
     * 最大缩放级别
     */
    maxLevel: number;

    /**
     * 数据源类型：图片或二进制
     */
    type: SourceType;

    /**
     * 地图投影类型
     * 4326: WGS84 经纬度坐标系 (GPS坐标)
     * 3857: Web墨卡托投影坐标系 (Google Maps, OpenStreetMap等使用)
     */
    projection: ProjectionType;

    /**
     * 地图边界，定义地图的经纬度范围
     */
    bounds?: Bounds;

    /**
     * URL模板字符串，用于生成瓦片URL
     * 例如: "https://example.com/tiles/{z}/{x}/{y}.png"
     */
    urlTemplate?: string;
}

export abstract class Source {
    /**
     * 最小缩放级别
     */
    minLevel: number;

    /**
     * 最大缩放级别
     */
    maxLevel: number;

    /**
     * 数据源类型：图片或二进制
     */
    type: SourceType;

    /**
     * 地图投影类型
     */
    projection: ProjectionType;

    /**
     * 地图边界，定义地图的经纬度范围
     */
    bounds?: Bounds;

    /**
     * URL模板字符串，用于生成瓦片URL
     */
    urlTemplate?: string;

    protected constructor(options: ISourceOptions) {
        this.minLevel = options.minLevel;
        this.maxLevel = options.maxLevel;
        this.type = options.type;
        this.projection = options.projection;
        this.bounds = options.bounds;
        this.urlTemplate = options.urlTemplate;
    }

    /**
     * 根据瓦片坐标生成URL
     * @param x X坐标
     * @param y Y坐标
     * @param z 缩放级别
     * @returns 瓦片URL
     */
    getUrl(x: number, y: number, z: number): string {
        if (!this.urlTemplate) {
            return "";
        }
        return this.replaceTemplate(this.urlTemplate, {x, y, z});
    }

    /**
     * 从模板字符串中替换参数
     * @param template 模板字符串，如 "{x}/{y}/{z}"
     * @param params 参数对象，如 { x: 1, y: 2, z: 3 }
     * @returns 替换后的字符串，如 "1/2/3"
     */
    replaceTemplate(template: string, params: Record<string, any>): string {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? String(params[key]) : match;
        });
    }
}