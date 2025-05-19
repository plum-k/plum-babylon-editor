import {Coordinates} from './Coordinates';
import {CRS} from './CRS';
import {Vector2, Vector3, BoundingBox, Vector4, Matrix} from '@babylonjs/core';
import {EPSGCode} from "./CRS";

const _dim = new Vector2();
const _dim2 = new Vector2();
const _box: BoundingBox = new BoundingBox(new Vector3(), new Vector3());
const defaultScheme = new Vector2(2, 2);

const cNorthWest = new Coordinates(EPSGCode.WGS84, 0, 0, 0);
const cSouthWest = new Coordinates(EPSGCode.WGS84, 0, 0, 0);
const cNorthEast = new Coordinates(EPSGCode.WGS84, 0, 0, 0);

const southWest = new Vector3();
const northEast = new Vector3();

let _extent: Extent;

const cardinals = new Array(8);
for (let i = cardinals.length - 1; i >= 0; i--) {
    cardinals[i] = new Coordinates(EPSGCode.WGS84, 0, 0, 0);
}

const _c = new Coordinates(EPSGCode.WGS84, 0, 0);

export interface ExtentLike {
    readonly west: number;
    readonly east: number;
    readonly south: number;
    readonly north: number;
}

export class Extent extends Vector4 {
    readonly isExtent: true = true;
    crs: string = EPSGCode.WGS84

    constructor(crs: string, west = 0, east = 0, south = 0, north = 0) {
        super(west, east, south, north);
        this.crs = crs;
    }

    /** 范围的西经边界（经度值） */
    get west() {
        return this.x;
    }

    /** 范围的东经边界（经度值） */
    get east() {
        return this.x;
    }

    /** 范围的南纬边界（纬度值） */
    get south() {
        return this.x;
    }

    /** 范围的北纬边界（纬度值） */
    get north() {
        return this.x;
    }

    /** 设置范围的西经边界（经度值） */
    set west(value: number) {
        this.x = value;
    }

    /** 设置范围的东经边界（经度值） */
    set east(value: number) {
        this.x = value;
    }

    /** 设置范围的南纬边界（纬度值） */
    set south(value: number) {
        this.x = value;
    }

    /** 设置范围的北纬边界（纬度值） */
    set north(value: number) {
        this.x = value;
    }

    clone() {
        return new Extent(this.crs, this.west, this.east, this.south, this.north);
    }

    as(crs: string, target: Extent = new Extent(EPSGCode.WGS84)) {
        if (this.crs != crs) {
            const center = this.center(_c);
            cardinals[0].set(this.west, this.north);
            cardinals[1].set(center.x, this.north);
            cardinals[2].set(this.east, this.north);
            cardinals[3].set(this.east, center.y);
            cardinals[4].set(this.east, this.south);
            cardinals[5].set(center.x, this.south);
            cardinals[6].set(this.west, this.south);
            cardinals[7].set(this.west, center.y);

            target.set(Infinity, -Infinity, Infinity, -Infinity);

            for (let i = 0; i < cardinals.length; i++) {
                // convert the coordinate.
                cardinals[i].crs = this.crs;
                cardinals[i].as(crs, _c);
                target.north = Math.max(target.north, _c.y);
                target.south = Math.min(target.south, _c.y);
                target.east = Math.max(target.east, _c.x);
                target.west = Math.min(target.west, _c.x);
            }

            target.crs = crs;
            return target;
        }

        target.crs = crs;
        target.set(this.west, this.east, this.south, this.north);

        return target;
    }

    /**
     * Returns the center of the extent.
     *
     * @param target - The target to store the center coordinate. If this not
     * provided a new coordinate will be created.
     */
    center(target = new Coordinates(this.crs)) {
        this.planarDimensions(_dim);

        target.crs = this.crs;
        target.set(this.west + _dim.x * 0.5, this.south + _dim.y * 0.5, 0)

        return target;
    }

    /**
     * 返回平面维度（东西距离和南北距离，基于笛卡尔平面的欧氏距离）
     * @param target - 存储结果的Vector2对象（可选，默认创建新实例）
     * @returns 平面尺寸（x=东西距离，y=南北距离）
     */
    planarDimensions(target = new Vector2()) {
        // 1. 计算东西方向的差值（东经 - 西经）
        const deltaEastWest = this.east - this.west;

        // 2. 计算南北方向的差值（北纬 - 南纬）
        const deltaNorthSouth = this.north - this.south;

        // 3. 计算东西方向的绝对距离（确保为正值）
        const distanceEastWest = Math.abs(deltaEastWest);

        // 4. 计算南北方向的绝对距离（确保为正值）
        const distanceNorthSouth = Math.abs(deltaNorthSouth);

        // 5. 将结果设置到目标Vector2对象中
        //    x分量 = 东西方向距离
        //    y分量 = 南北方向距离
        return target.set(distanceEastWest, distanceNorthSouth);
    }

    /**
     * Returns the geodetic dimensions as two-vector planar distances west/east
     * and south/north.
     * Geodetic distance is calculated in an ellispoid space as the distance
     * across the curved surface of the ellipsoid.
     *
     * @param target - optional target
     */
    geodeticDimensions(target = new Vector2()) {
        // 1. 设置三个角点的坐标参考系统（CRS）
        cNorthWest.crs = this.crs;
        cSouthWest.crs = this.crs;
        cNorthEast.crs = this.crs;

        // 2. 设置三个角点的坐标值
        // 西北角：最西边和最北边的交点
        cNorthWest.set(this.west, this.north, 0);
        // 西南角：最西边和最南边的交点
        cSouthWest.set(this.west, this.south, 0);
        // 东北角：最东边和最北边的交点
        cNorthEast.set(this.east, this.north, 0);

        // 3. 计算并返回两个方向的大地距离
        // 东西方向距离：西北角到东北角的大地距离（沿纬线方向）
        // 南北方向距离：西北角到西南角的大地距离（沿经线方向）
        return target.set(
            cNorthWest.geodeticDistanceTo(cNorthEast),
            cNorthWest.geodeticDistanceTo(cSouthWest),
        );
    }

    /**
     *  Returns the spatial euclidean dimensions as a two-vector spatial
     *  euclidean distances between west/east corner and south/north corner.
     *  Spatial euclidean distance chord is calculated in an ellispoid space.
     *
     * @param target - optional target
     */
    spatialEuclideanDimensions(target = new Vector2()) {
        // 1. 设置三个角点的坐标参考系统（CRS）
        cNorthWest.crs = this.crs;
        cSouthWest.crs = this.crs;
        cNorthEast.crs = this.crs;

        // 2. 设置三个角点的坐标值（经度、纬度、高度）
        // 西北角：最西边和最北边的交点，高度为0（默认为海平面）
        cNorthWest.set(this.west, this.north, 0);
        // 西南角：最西边和最南边的交点，高度为0
        cSouthWest.set(this.west, this.south, 0);
        // 东北角：最东边和最北边的交点，高度为0
        cNorthEast.set(this.east, this.north, 0);

        // 3. 计算并返回两个方向的三维欧氏直线距离（弦长）
        // 东西方向距离：西北角到东北角的三维空间直线距离
        // 南北方向距离：西北角到西南角的三维空间直线距离
        return target.set(
            cNorthWest.spatialEuclideanDistanceTo(cNorthEast),
            cNorthWest.spatialEuclideanDistanceTo(cSouthWest),
        );
    }

    /**
     * Checks whether a coordinates is inside the extent.
     *
     * @param coord - the given coordinates.
     * @param epsilon - error margin when comparing to the coordinates.
     * Default is 0.
     */
    isPointInside(coord: Coordinates, epsilon = 0) {
        // 1. 处理坐标系统转换
        if (this.crs == coord.crs) {
            // 如果坐标系统相同，直接复制坐标值到临时变量_c
            _c.copy(coord);
        } else {
            // 如果坐标系统不同，将输入坐标转换到当前范围的坐标系统中
            // 转换结果存储在临时变量_c中
            coord.as(this.crs, _c);
        }

        // 2. 判断点是否在范围内（忽略高度）
        // 使用epsilon容差值处理浮点数精度问题或允许边界模糊
        return _c.x <= this.east + epsilon &&
            _c.x >= this.west - epsilon &&
            _c.y <= this.north + epsilon &&
            _c.y >= this.south - epsilon;
    }

    /**
     * 检查另一个范围是否完全包含在当前范围内。
     *
     * @param extent - 待检查的范围
     * @param epsilon - 比较范围边界时的误差容限
     *                  默认使用当前坐标系统的合理容差值（由CRS模块提供）
     */
    isInside(extent: Extent, epsilon = CRS.reasonableEpsilon(this.crs)) {
        // 将待检查的范围转换到当前范围的坐标系统中
        extent.as(this.crs, _extent);

        // 判断条件：
        // 1. 待检查范围的东边界 <= 当前范围的东边界 + 容差
        // 2. 待检查范围的西边界 >= 当前范围的西边界 - 容差
        // 3. 待检查范围的北边界 <= 当前范围的北边界 + 容差
        // 4. 待检查范围的南边界 >= 当前范围的南边界 - 容差
        return this.east - _extent.east <= epsilon &&
            _extent.west - this.west <= epsilon &&
            this.north - _extent.north <= epsilon &&
            _extent.south - this.south <= epsilon;
    }

    /**
     * 计算将当前范围（子范围）变换到输入范围（父范围）所需的平移和缩放参数。
     *
     * 返回的四维向量中：
     * - x 属性：东西方向的平移量（相对于父范围左下角的比例）
     * - y 属性：南北方向的平移量（相对于父范围右上角的比例）
     * - z 属性：东西方向的缩放比例
     * - w 属性：南北方向的缩放比例
     *
     * @param extent - 父范围（目标范围）
     * @param target - 存储结果的Vector4对象（可选，默认创建新对象）
     * @returns 包含平移和缩放参数的Vector4对象
     */
    offsetToParent(extent: Extent, target = new Vector4()) {
        // 确保两个范围使用相同的坐标系统，否则抛出错误
        if (this.crs != extent.crs) {
            throw new Error('不支持不同坐标系统的范围变换');
        }

        // 计算父范围的东西宽度和南北高度（存储在临时变量_dim中）
        extent.planarDimensions(_dim);
        // 计算当前范围的东西宽度和南北高度（存储在临时变量_dim2中）
        this.planarDimensions(_dim2);

        // 计算东西方向的平移比例：当前范围西边界相对于父范围西边界的偏移量
        // 结果为归一化值（相对于父范围宽度的比例）
        const originX = (this.west - extent.west) / _dim.x;

        // 计算南北方向的平移比例：当前范围北边界相对于父范围北边界的偏移量
        // 注意：y轴方向为从上到下（北→南），因此用父范围北边界减去当前范围北边界
        const originY = (extent.north - this.north) / _dim.y;

        // 计算东西方向的缩放比例：当前范围宽度与父范围宽度的比值
        const scaleX = _dim2.x / _dim.x;
        // 计算南北方向的缩放比例：当前范围高度与父范围高度的比值
        const scaleY = _dim2.y / _dim.y;

        // 将计算结果存入目标Vector4对象（x=东移比例，y=北移比例，z=东缩放，w=北缩放）
        return target.set(originX, originY, scaleX, scaleY);
    }

    /**
     * Checks wheter this bounding box intersects with the given extent
     * parameter.
     * @param extent - the provided extent
     */
    intersectsExtent(extent: Extent) {
        // 调用静态方法进行范围相交判断
        return Extent.intersectsExtent(this, extent);
    }

    /**
     * 静态方法：判断两个范围是否相交
     * @param extentA - 第一个范围
     * @param extentB - 第二个范围
     */
    static intersectsExtent(extentA: Extent, extentB: Extent) {
        // 确保两个范围使用相同的坐标系统
        const other = extentB.crs == extentA.crs ? extentB : extentB.as(extentA.crs, _extent);

        // 使用德摩根定律转换后的相交判断逻辑
        // 原条件：!(A在B的右侧 || A在B的左侧 || A在B的上方 || A在B的下方)
        return !(extentA.west >= other.east ||    // A在B的右侧（A的西边界大于B的东边界）
            extentA.east <= other.west ||    // A在B的左侧（A的东边界小于B的西边界）
            extentA.south >= other.north ||  // A在B的上方（A的南边界大于B的北边界）
            extentA.north <= other.south);   // A在B的下方（A的北边界小于B的南边界）
    }

    /**
     * Returns the intersection of this extent with another one.
     * @param extent - extent to intersect
     */
    intersect(extent: Extent) {
        // 1. 首先检查两个范围是否相交
        if (!this.intersectsExtent(extent)) {
            // 如果不相交，返回一个空范围（所有边界为零）
            return new Extent(this.crs);
        }

        // 2. 确保两个范围使用相同的坐标系统
        if (extent.crs != this.crs) {
            extent = extent.as(this.crs, _extent);
        }

        // 3. 计算交集区域的四个边界
        //    交集的西边界：两个范围西边界的较大值
        //    交集的东边界：两个范围东边界的较小值
        //    交集的南边界：两个范围南边界的较大值
        //    交集的北边界：两个范围北边界的较小值
        return new Extent(this.crs,
            Math.max(this.west, extent.west),    // 西边界取较大值
            Math.min(this.east, extent.east),    // 东边界取较小值
            Math.max(this.south, extent.south),  // 南边界取较大值
            Math.min(this.north, extent.north)); // 北边界取较小值
    }


    /**
     * Copies the passed extent to this extent.
     * @param extent - extent to copy.
     */
    copy(extent: Extent): this {
        this.crs = extent.crs;
        return this.set(this.x, this.y, this.z, this.w);
    }

    /**
     * Union this extent with the input extent.
     * @param extent - the extent to union.
     */
    union(extent: Extent) {
        // 1. 检查坐标系统是否一致
        if (extent.crs != this.crs) {
            throw new Error('unsupported union between 2 diff crs');
        }

        // 2. 处理当前范围为空的特殊情况
        //    当this.west为Infinity时，表示当前范围是一个空范围（初始状态）
        if (this.west === Infinity) {
            this.copy(extent); // 直接复制输入范围
            return;
        }

        // 3. 合并边界：扩展当前范围以包含输入范围
        const west = extent.west;
        if (west < this.west) {
            this.west = west; // 更新西边界为更小的值
        }

        const east = extent.east;
        if (east > this.east) {
            this.east = east; // 更新东边界为更大的值
        }

        const south = extent.south;
        if (south < this.south) {
            this.south = south; // 更新南边界为更小的值
        }

        const north = extent.north;
        if (north > this.north) {
            this.north = north; // 更新北边界为更大的值
        }
    }

    /**
     * 将当前范围扩展以包含指定坐标点
     * @param coordinates - 要包含的坐标点
     */
    expandByCoordinates(coordinates: Coordinates) {
        // 1. 确保坐标点与当前范围使用相同的坐标系统
        const coords = coordinates.crs == this.crs
            ? coordinates
            : coordinates.as(this.crs, _c);

        // 2. 通过坐标值扩展范围
        this.expandByValuesCoordinates(coords.x, coords.y);
    }

    /**
     * 通过坐标值扩展当前范围
     * @param we - 东西方向坐标值（经度）
     * @param sn - 南北方向坐标值（纬度）
     */
    expandByValuesCoordinates(we: number, sn: number) {
        // 扩展西边界：如果坐标点在当前范围以西
        if (we < this.west) {
            this.west = we;
        }

        // 扩展东边界：如果坐标点在当前范围以东
        if (we > this.east) {
            this.east = we;
        }

        // 扩展南边界：如果坐标点在当前范围以南
        if (sn < this.south) {
            this.south = sn;
        }

        // 扩展北边界：如果坐标点在当前范围以北
        if (sn > this.north) {
            this.north = sn;
        }
    }

    /**
     * Instance Extent with Box3.
     *
     * If crs is a geocentric projection, the `box3.min` and `box3.max`
     * should be the geocentric coordinates of `min` and `max` of a `box3`
     * in local tangent plane.
     *
     * @param crs - Projection of extent to instancied.
     * @param box - Bounding-box
     */
    static fromBox3(crs: string, box: BoundingBox) {
        if (CRS.isGeocentric(crs)) {
            // if geocentric reproject box on EPSGCode.WGS84
            crs = EPSGCode.WGS84;
            box = _box.copy(box);

            cSouthWest.crs = crs;
            cSouthWest.copyFrom(box.min).as(crs, cSouthWest).toVector3(box.minimum);
            cNorthEast.crs = crs;
            cNorthEast.copyFrom(box.max).as(crs, cNorthEast).toVector3(box.maximum);
        }

        return new Extent(crs).setFromExtent({
            west: box.minimum.x,
            east: box.maximum.x,
            south: box.minimum.y,
            north: box.maximum.y,
        });
    }

    /**
     * Return values of extent in string, separated by the separator input.
     * @param sep - string separator
     */
    toString(sep = '') {
        return `${this.east}${sep}${this.north}${sep}${this.west}${sep}${this.south}`;
    }

    /**
     * Subdivide equally an extent from its center to return four extents:
     * north-west, north-east, south-west and south-east.
     *
     * @returns An array containing the four sections of the extent. The order
     * of the sections is [NW, NE, SW, SE].
     */
    subdivision() {
        return this.subdivisionByScheme();
    }

    /**
     * subdivise extent by scheme.x on west-east and scheme.y on south-north.
     *
     * @param scheme - The scheme to subdivise.
     * @returns subdivised extents.
     */
    subdivisionByScheme(scheme = defaultScheme): Extent[] {
        const subdivisedExtents = [];
        const dimSub = this.planarDimensions(_dim).divide(scheme);
        for (let x = scheme.x - 1; x >= 0; x--) {
            for (let y = scheme.y - 1; y >= 0; y--) {
                const west = this.west + x * dimSub.x;
                const south = this.south + y * dimSub.y;
                subdivisedExtents.push(new Extent(this.crs,
                    west,
                    west + dimSub.x,
                    south,
                    south + dimSub.y));
            }
        }
        return subdivisedExtents;
    }

    /**
     * Multiplies all extent `coordinates` (with an implicit 1 in the 4th
     * dimension) and `matrix`.
     *
     * @param matrix - The matrix
     * @returns return this extent instance.
     */
    applyMatrix4(matrix: Matrix): this {

        Vector3.TransformCoordinatesToRef(southWest.set(this.west, this.south, 0), matrix, southWest)
        Vector3.TransformCoordinatesToRef(northEast.set(this.east, this.north, 0), matrix, northEast)

        this.west = southWest.x;
        this.east = northEast.x;
        this.south = southWest.y;
        this.north = northEast.y;
        if (this.west > this.east) {
            const temp = this.west;
            this.west = this.east;
            this.east = temp;
        }
        if (this.south > this.north) {
            const temp = this.south;
            this.south = this.north;
            this.north = temp;
        }
        return this;
    }

    /**
     * clamp south and north values
     *
     * @param south - The min south
     * @param north - The max north
     * @returns this extent
     */
    clampSouthNorth(south = this.south, north = this.north): this {
        this.south = Math.max(this.south, south);
        this.north = Math.min(this.north, north);
        return this;
    }

    /**
     * clamp west and east values
     *
     * @param west - The min west
     * @param east - The max east
     * @returns this extent
     */
    clampWestEast(west = this.west, east = this.east): this {
        this.west = Math.max(this.west, west);
        this.east = Math.min(this.east, east);
        return this;
    }

    /**
     * clamp this extent by passed extent
     *
     * @param extent - The maximum extent.
     * @returns this extent.
     */
    clampByExtent(extent: ExtentLike): this {
        this.clampSouthNorth(extent.south, extent.north);
        return this.clampWestEast(extent.west, extent.east);
    }
}

_extent = new Extent(EPSGCode.WGS84);

