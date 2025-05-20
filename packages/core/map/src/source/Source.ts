import {DataSourceFormat, Projection} from "../enum";
import {Extent} from "../geographic";

export interface ISourceOptions {
    dataSourceFormat: DataSourceFormat;  // 数据源格式
    minLevel: number;                    // 最小层级
    maxLevel: number;                    // 最大层级
    projectionType: Projection;          // 投影类型
    extent: Extent;
    url: string;
}

export class Source {
    private options: ISourceOptions;
    minLevel: number = 0
    maxLevel: number = 0
    url: string = ""
    extent: Extent;

    constructor(options: ISourceOptions) {
        this.options = options;
        this.minLevel = options.minLevel;
        this.maxLevel = options.maxLevel;
        this.url = options.url;
        this.extent = options.extent;
    }

    getUrl(x: number, y: number, z: number): string {
        return ""
    }

    update(){

    }


}