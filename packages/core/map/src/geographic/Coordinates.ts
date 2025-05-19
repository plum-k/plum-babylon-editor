import {DefaultEllipsoid} from './Ellipsoid';
import {CRS, EPSGCode} from "./CRS";
import {Vector3} from '@babylonjs/core';
import {clamp} from "lodash-es";


export class Coordinates extends Vector3 {
    readonly isCoordinates: boolean = true;
    crs: string | EPSGCode = EPSGCode.WGS84;
    _normal: Vector3 = new Vector3()
    _normalNeedsUpdate: boolean = true;

    static v0 = new Vector3();
    static v1 = new Vector3();

    static coord0 = new Coordinates(EPSGCode.WGS84, 0, 0, 0);
    static coord1 = new Coordinates(EPSGCode.WGS84, 0, 0, 0);

    constructor(crs: string = EPSGCode.WGS84, x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.crs = crs;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get longitude() {
        return this.x;
    }

    get latitude() {
        return this.y;
    }

    get altitude() {
        return this.z;
    }

    set longitude(value) {
        this.x = value;
    }

    set latitude(value) {
        this.y = value;
    }

    set altitude(value) {
        this.z = value;
    }

    setCrs(crs: string | EPSGCode): this {
        this.crs = crs;
        return this;
    }

    clone(): Coordinates {
        return new Coordinates(this.crs, this.x, this.y, this.z);
    }

    copy(src: Coordinates): this {
        super.copyFrom(src)
        this.crs = src.crs;
        return this;
    }

    toString() {
        return `crs: ${this.crs}, x: ${this.x}, y: ${this.y}, z: ${this.z}`;
    }

    /**
     * The geodesic normal of the coordinate.
     */
    get geodesicNormal() {
        if (this._normalNeedsUpdate) {
            this._normalNeedsUpdate = false;

            if (CRS.is4326(this.crs)) {
                DefaultEllipsoid.geodeticSurfaceNormalCartographic(this, this._normal);
            } else if (this.crs === EPSGCode.GEOCENTRIC) {
                DefaultEllipsoid.geodeticSurfaceNormal(this, this._normal);
            } else {
                this._normal.set(0, 0, 1);
            }
        }

        return this._normal;
    }

    toVector3(target: Vector3 = new Vector3()): Vector3 {
        target.x = this.x;
        target.y = this.y;
        target.z = this.z;
        return target
    }

    planarDistanceTo(coordinates: Coordinates): number {
        this.toVector3(Coordinates.v0).z = 0;
        coordinates.toVector3(Coordinates.v1).z = 0;
        return Vector3.Distance(this, coordinates);
    }

    geodeticDistanceTo(coordinates: Coordinates): number {
        this.as(EPSGCode.WGS84, Coordinates.coord0);
        coordinates.as(EPSGCode.WGS84, Coordinates.coord1);
        return DefaultEllipsoid.geodesicDistance(Coordinates.coord0, Coordinates.coord1);
    }

    spatialEuclideanDistanceTo(coordinates: Coordinates): number {
        this.as(EPSGCode.GEOCENTRIC, Coordinates.coord0).toVector3(Coordinates.v0);
        coordinates.as(EPSGCode.GEOCENTRIC, Coordinates.coord1).toVector3(Coordinates.v1);
        return Vector3.Distance(Coordinates.v0, Coordinates.v1);
    }

    as(crs: string | EPSGCode, target = new Coordinates(crs)): Coordinates {
        if (this.crs == crs) {
            target.copy(this);
        } else {
            if (CRS.is4326(this.crs) && crs === EPSGCode.MERCATOR) {
                this.y = clamp(this.y, -89.999999, 89.999999);
            }
            const converter = CRS.proj4cache(this.crs, crs);
            const coordinateArray = converter.forward([this.x, this.y, this.z]);
            target.fromArray(coordinateArray);
        }
        target.crs = crs;
        return target;
    }

    toMercator(target = new Coordinates(EPSGCode.MERCATOR)) {
        return this.as(EPSGCode.MERCATOR, target);
    }

    toWgs84(target = new Coordinates(EPSGCode.WGS84)) {
        return this.as(EPSGCode.WGS84, target);
    }

    toGeodesic(target = new Coordinates(EPSGCode.GEOCENTRIC)) {
        return this.as(EPSGCode.GEOCENTRIC, target);
    }
}


