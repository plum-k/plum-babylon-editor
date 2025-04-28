import {Mesh} from "@babylonjs/core";
import {TileMesh} from "./TileMesh";

/**
 * 瓦片选项接口
 */
export interface ITileOptions {
    /**
     * 瓦片X坐标
     */
    x: number;

    /**
     * 瓦片Y坐标
     */
    y: number;

    /**
     * 瓦片缩放级别
     */
    z: number;
}

/**
 * 生成瓦片名称
 * @param x X坐标
 * @param y Y坐标
 * @param z 缩放级别
 * @returns 瓦片名称
 */
function getTileName(x: number, y: number, z: number): string {
    return `tile_${z}_${x}_${y}`;
}

/**
 * 瓦片类，表示地图的一个瓦片
 */
export class Tile{
    /**
     * 瓦片X坐标
     */
    x: number;

    /**
     * 瓦片Y坐标
     */
    y: number;

    /**
     * 瓦片缩放级别
     */
    z: number;
    private tileMesh: TileMesh;
    private name: string;


    /**
     * 构造函数
     * @param options 瓦片选项
     */
    constructor(options?: ITileOptions) {
        this.name = getTileName(options.x, options.y, options.z);

        this.tileMesh = new TileMesh({
            name: this.name,
        });

        this.x = options.x;
        this.y = options.y;
        this.z = options.z;
        this.initialize();
    }

    /**
     * 初始化瓦片
     */
    private initialize(): void {
        // 在这里实现瓦片的初始化逻辑
        // 例如：加载纹理、创建网格等

        if (this.source) {
            const url = this.source.getUrl(this.x, this.y, this.z);
            // 使用URL加载纹理或其他资源
        }
    }
}

