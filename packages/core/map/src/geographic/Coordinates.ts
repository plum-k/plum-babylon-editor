import proj4 from 'proj4';
import {Ellipsoid} from './Ellipsoid';
import {CRS} from "./CRS";
import {Tools, Vector3, Ray} from '@babylonjs/core';
import {clamp} from "lodash-es";

const ellipsoid = new Ellipsoid();

const v0 = new Vector3();
const v1 = new Vector3();

let coord0: Coordinates;
let coord1: Coordinates;

export interface CoordinatesLike {
    readonly crs: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
}


export class Coordinates extends Vector3 {
    /**
     * Read-only flag to check if a given object is of type `Coordinates`.
     */
    readonly isCoordinates: boolean;
    /**
     * A default or user-defined CRS (see {@link string}).
     */
    crs: string;
    private _normal: Vector3;
    private _normalNeedsUpdate: boolean;

    /**
     * @param crs - A default or user-defined CRS (see {@link string}).
     * @param x - x or longitude value.
     * @param y - y or latitude value.
     * @param z - z or altitude value.
     */
    constructor(crs: string, x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.isCoordinates = true;

        this.crs = crs;

        // Normal
        this._normal = new Vector3();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((x as any).length > 0) { // deepscan-disable-line
            console.warn(
                'Deprecated Coordinates#constructor(string, number[]),',
                'use `new Coordinates(string).setFromArray(number[])` instead.',
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.setFromArray(x as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((x as any).isVector3 || (x as any).isCoordinates) {
            console.warn(
                'Deprecated Coordinates#constructor(string, Vector3),',
                'use `new Coordinates(string).setFromVector3(Vector3)` instead.',
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.setFromVector3(x as any);
        } else {
            this.setFromValues(x, y, z);
        }

        this._normalNeedsUpdate = true;
    }

    /**
     * Sets the Coordinate Reference System.
     * @param crs - Coordinate Reference System (e.g. 'EPSG:4978')
     */
    setCrs(crs: string): this {
        this.crs = crs;
        return this;
    }

    /**
     * Sets the x, y and z components of this coordinate.
     *
     * @param x - x or longitude value.
     * @param y - y or latitude value.
     * @param z - z or altitude value.
     */
    setFromValues(x: number = 0, y: number = 0, z: number = 0): this {
        this.x = x;
        this.y = y;
        this.z = z;

        this._normalNeedsUpdate = true;
        return this;
    }

    /**
     * Sets the `(x, y, z)` vector of this coordinate from a 3-dimensional
     * vector-like object. This object shall have both `x`, `y` and `z`
     * properties.
     *
     * @param v - The source object.
     */
    setFromVector3(v: Vector3): this {
        return this.setFromValues(v.x, v.y, v.z);
    }

    /**
     * Returns a new coordinate with the same `(x, y, z)` vector and crs as this
     * one.
     */
    // @ts-ignore
    clone(): Coordinates {
        return new Coordinates(this.crs, this.x, this.y, this.z);
    }

    /**
     * Copies the `(x, y, z)` vector components and crs of the passed coordinate
     * to this coordinate.
     *
     * @param src - The source coordinate to copy from.
     */
    copy(src: CoordinatesLike): this {
        this.crs = src.crs;
        return this.setFromVector3(src);
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

    set altitude(value) {
        this.z = value;
    }

    /**
     * The geodesic normal of the coordinate.
     */
    get geodesicNormal() {
        if (this._normalNeedsUpdate) {
            this._normalNeedsUpdate = false;

            if (CRS.is4326(this.crs)) {
                ellipsoid.geodeticSurfaceNormalCartographic(this, this._normal);
            } else if (this.crs == 'EPSG:4978') {
                ellipsoid.geodeticSurfaceNormal(this, this._normal);
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

    /**
     * Computes the planar distance from this coordinates to `coord`.
     * **Planar distance** is the straight-line euclidean distance calculated in
     * a 2D cartesian coordinate system.
     */
    planarDistanceTo(coord: Coordinates): number {
        this.toVector3(v0).setZ(0);
        coord.toVector3(v1).setZ(0);
        return v0.distanceTo(v1);
    }

    /**
     * Computes the geodetic distance from this coordinates to `coord`.
     * **Geodetic distance** is calculated in an ellipsoid space as the shortest
     * distance across the curved surface of the ellipsoid.
     */
    geodeticDistanceTo(coord: Coordinates): number {
        this.as('EPSG:4326', coord0);
        coord.as('EPSG:4326', coord1);
        return ellipsoid.geodesicDistance(coord0, coord1);
    }

    /**
     * Computes the euclidean distance from this coordinates to `coord` in a
     * WGS84 projection.
     *
     * @param coord - The coordinate
     * @returns earth euclidean distance
     */
    spatialEuclideanDistanceTo(coord: Coordinates): number {
        this.as('EPSG:4978', coord0).toVector3(v0);
        coord.as('EPSG:4978', coord1).toVector3(v1);
        return v0.distanceTo(v1);
    }

    /**
     * Multiplies this coordinate (with an implicit 1 in the 4th dimension)
     * by `mat`, and divides by perspective.
     *
     * @param mat - The matrix.
     */
    applyMatrix4(mat: Matrix4): this {
        Vector3.prototype.applyMatrix4.call(this, mat);
        return this;
    }

    /**
     * Projects this coordinate to the specified
     * [CRS](http://inspire.ec.europa.eu/theme/rs).
     *
     * @param crs - The target CRS to which the coordinate will be converted.
     * @param target - The target to store the projected coordinate. If this not
     * provided a new coordinate will be created.
     *
     * @returns The coordinate projected into the specified CRS.
     *
     * @example Conversion from a geographic to a geocentric reference system
     * ```js
     * const geographicCoords = new Coordinates('EPSG:4326',
     *     2.33,        // longitude
     *     48.24,       // latitude
     *     24999549,    // altitude
     * );
     * const geocentricCoords = geographicCoords.as('EPSG:4978');
     * ```
     *
     * @example Conversion from a geocentric to a geographic reference system
     * ```js
     * const geocentricCoords = new Coordinates('EPSG:4978',
     *     20885167,    // x
     *     849862,      // y
     *     23385912,    // z
     * );
     * const geographicCoords = geocentricCoords.as('EPSG:4326');
     * ```
     */
    as(crs: string, target = new Coordinates(crs)): Coordinates {
        if (this.crs == crs) {
            target.copy(this);
        } else {
            if (CRS.is4326(this.crs) && crs == 'EPSG:3857') {
                this.y = clamp(-89.999999, 89.999999, this.y);
            }
            const converter = CRS.proj4cache(this.crs, crs);
            const coordinateArray = converter.forward([this.x, this.y, this.z]);
            target.fromArray(coordinateArray);
        }
        target.crs = crs;
        return target;
    }
}

coord0 = new Coordinates('EPSG:4326', 0, 0, 0);
coord1 = new Coordinates('EPSG:4326', 0, 0, 0);
