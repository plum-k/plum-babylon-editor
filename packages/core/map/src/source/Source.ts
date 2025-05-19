import {DataSourceFormat, Projection} from "../enum";
import {Bounds} from "../interface";

export interface ISourceOptions {
    dataSourceFormat: DataSourceFormat;  // 数据源格式
    minLevel: number;                    // 最小层级
    maxLevel: number;                    // 最大层级
    projectionType: Projection;          // 投影类型
    bounds: Bounds;
}

export class Source {
    private options: ISourceOptions;

    constructor(options: ISourceOptions) {
        this.options = options;
    }

    getUrl(x: number, y: number, z: number): string {
        return ""
    }

}