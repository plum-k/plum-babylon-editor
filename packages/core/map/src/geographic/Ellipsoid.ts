import proj4 from 'proj4';
import {Coordinates} from './Coordinates';
import {Tools, Vector3, Ray} from '@babylonjs/core';
import {Tool} from "../tool/Tool";

export const ellipsoidSizes = new Vector3(
    proj4.WGS84.a,
    proj4.WGS84.a,
    proj4.WGS84.b);
console.log("ellipsoidSizes0",ellipsoidSizes)

const normal = new Vector3();

export  class Ellipsoid {

    size: Vector3 = new Vector3();
    eccentricity: number = 0

    private _radiiSquared: Vector3 = new Vector3();
    private _invRadiiSquared: Vector3 = new Vector3();

    constructor(size: Vector3 = ellipsoidSizes) {
        this.setSize(size);
    }

    /**
     * Computes the normal vector to an ellipsoid at the given cartesian
     * coordinate `(x, y, z)`.
     *
     * @param cartesian - The given cartesian coordinate.
     * @param target - An object to store this vector to. If this is not
     * specified, a new vector will be created.
     */
    geodeticSurfaceNormal(
        cartesian: Coordinates,
        target = new Vector3(),
    ): Vector3 {
        return cartesian.toVector3(target).multiply(this._invRadiiSquared).normalize();
    }

    /**
     * Computes the normal vector to an ellipsoid at the given geographic
     * coordinate `(longitude, latitude, altitude)`.
     *
     * @param coordCarto - The given geographic coordinate.
     * @param target - An object to store this vector to. If this is not
     * specified, a new vector will be created.
     */
    geodeticSurfaceNormalCartographic(
        coordCarto: Coordinates,
        target = new Vector3(),
    ): Vector3 {
        const longitude = Tools.ToRadians(coordCarto.longitude);
        const latitude = Tools.ToRadians(coordCarto.latitude);
        const cosLatitude = Math.cos(latitude);

        return target.set(cosLatitude * Math.cos(longitude),
            cosLatitude * Math.sin(longitude),
            Math.sin(latitude));
    }

    /**
     * Sets the length of the semi-axes of this ellipsoid from a 3-dimensional
     * vector-like object. The object shall have both `x`, `y` and `z`
     * properties.
     *
     * @param size - The source vector.
     */
    setSize(size: Vector3): this {
        this.size.set(size.x, size.y, size.z);

        Tool.multiplyVectors(this._radiiSquared,size,size)

        this._invRadiiSquared.x = (size.x === 0) ? 0 : 1 / this._radiiSquared.x;
        this._invRadiiSquared.y = (size.y === 0) ? 0 : 1 / this._radiiSquared.y;
        this._invRadiiSquared.z = (size.z === 0) ? 0 : 1 / this._radiiSquared.z;

        this.eccentricity = Math.sqrt(this._radiiSquared.x - this._radiiSquared.z) / this.size.x;

        return this;
    }

    cartographicToCartesian(
        coordCarto: Coordinates,
        target = new Vector3(),
    ): Vector3 {
        normal.copy(coordCarto.geodesicNormal);

        target.multiplyVectors(this._radiiSquared, normal);

        const gamma = Math.sqrt(normal.dot(target));

        target.divideScalar(gamma);

        normal.multiplyScalar(coordCarto.altitude);

        return target.add(normal);
    }

    /**
     * Convert cartesian coordinates to geographic according to the current
     * ellipsoid of revolution.
     * @param position - The coordinate to convert
     * @param target - coordinate to copy result
     * @returns an object describing the coordinates on the reference ellipsoid,
     * angles are in degree
     */
    cartesianToCartographic(
        position: Vector3,
        target = new Coordinates('EPSG:4326', 0, 0, 0),
    ): Coordinates {
        // for details, see for example http://www.linz.govt.nz/data/geodetic-system/coordinate-conversion/geodetic-datum-conversions/equations-used-datum
        // TODO the following is only valable for oblate ellipsoid of
        // revolution. do we want to support triaxial ellipsoid?
        const R = Math.sqrt(position.x * position.x +
            position.y * position.y +
            position.z * position.z);
        const a = this.size.x; // x
        const b = this.size.z; // z
        const e = Math.abs((a * a - b * b) / (a * a));
        const f = 1 - Math.sqrt(1 - e);
        const rsqXY = Math.sqrt(position.x * position.x + position.y * position.y);

        const theta = Math.atan2(position.y, position.x);
        const nu = Math.atan(position.z / rsqXY * ((1 - f) + e * a / R));

        const sinu = Math.sin(nu);
        const cosu = Math.cos(nu);

        const phi = Math.atan(
            (position.z * (1 - f) + e * a * sinu * sinu * sinu) /
            ((1 - f) * (rsqXY - e * a * cosu * cosu * cosu)));

        const h = (rsqXY * Math.cos(phi)) +
            position.z * Math.sin(phi) -
            a * Math.sqrt(1 - e * Math.sin(phi) * Math.sin(phi));

        return target.set(
            Tools.ToDegrees(theta),
            Tools.ToDegrees(phi),
            h,
        );
    }

    cartographicToCartesianArray(coordCartoArray: Coordinates[]): Vector3[] {
        const cartesianArray = [];
        for (let i = 0; i < coordCartoArray.length; i++) {
            cartesianArray.push(this.cartographicToCartesian(coordCartoArray[i]));
        }

        return cartesianArray;
    }

    intersection(ray: Ray): Vector3 | false {
        const EPSILON = 0.0001;
        const O_C = ray.origin;
        const dir = ray.direction;
        // normalizeVector( dir );

        const a =
            ((dir.x * dir.x) * this._invRadiiSquared.x) +
            ((dir.y * dir.y) * this._invRadiiSquared.y) +
            ((dir.z * dir.z) * this._invRadiiSquared.z);

        const b =
            ((2 * O_C.x * dir.x) * this._invRadiiSquared.x) +
            ((2 * O_C.y * dir.y) * this._invRadiiSquared.y) +
            ((2 * O_C.z * dir.z) * this._invRadiiSquared.z);

        const c =
            ((O_C.x * O_C.x) * this._invRadiiSquared.x) +
            ((O_C.y * O_C.y) * this._invRadiiSquared.y) +
            ((O_C.z * O_C.z) * this._invRadiiSquared.z) - 1;

        let d = ((b * b) - (4 * a * c));
        if (d < 0 || a === 0 || b === 0 || c === 0) {
            return false;
        }

        d = Math.sqrt(d);

        const t1 = (-b + d) / (2 * a);
        const t2 = (-b - d) / (2 * a);

        if (t1 <= EPSILON && t2 <= EPSILON) {
            // both intersections are behind the ray origin
            return false;
        }

        let t = 0;
        if (t1 <= EPSILON) {
            t = t2;
        } else if (t2 <= EPSILON) {
            t = t1;
        } else {
            t = (t1 < t2) ? t1 : t2;
        }

        if (t < EPSILON) {
            return false;
        } // Too close to intersection

        const inter = new Vector3();

        inter.addVectors(ray.origin, dir.clone().setLength(t));

        return inter;
    }

    /**
     * Calculate the geodesic distance, between coordCarto1 and coordCarto2.
     * It's most short distance on ellipsoid surface between coordCarto1 and
     * coordCarto2.
     * It's called orthodromy.
     *
     * @param coordCarto1 - The coordinate carto 1
     * @param coordCarto2 - The coordinate carto 2
     * @returns The orthodromic distance between the two given coordinates.
     */
    geodesicDistance(coordCarto1: Coordinates, coordCarto2: Coordinates): number {
        // The formula uses the distance on approximated sphere,
        // with the nearest local radius of curvature of the ellipsoid
        // https://geodesie.ign.fr/contenu/fichiers/Distance_longitude_latitude.pdf
        const longitude1 = Tools.ToRadians(coordCarto1.longitude);
        const latitude1 = Tools.ToRadians(coordCarto1.latitude);
        const longitude2 = Tools.ToRadians(coordCarto2.longitude);
        const latitude2 = Tools.ToRadians(coordCarto2.latitude);

        const distRad = Math.acos(
            Math.sin(latitude1) * Math.sin(latitude2) +
            Math.cos(latitude1) * Math.cos(latitude2) * Math.cos(longitude2 - longitude1));

        const e = this.eccentricity;
        const latMoy = (latitude1 + latitude2) * 0.5;
        const es = (e * Math.sin(latMoy)) ** 2;
        const rho = this.size.x * (1 - e ** 2) / ((1 - es) ** (3 / 2));
        const N = this.size.x / Math.sqrt(1 - es);

        return distRad * Math.sqrt(rho * N);
    }
}

export const DefaultEllipsoid = new Ellipsoid();
