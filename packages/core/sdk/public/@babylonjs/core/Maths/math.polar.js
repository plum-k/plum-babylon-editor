import { Vector2, Vector3 } from "./math.vector.js";
/**
 * Class used to store (r, theta) vector representation
 */
export class Polar {
    /**
     * Creates a new Polar object
     * @param radius the radius of the vector
     * @param theta the angle of the vector
     */
    constructor(radius, theta) {
        this.radius = radius;
        this.theta = theta;
        this.radius = radius;
        this.theta = theta;
    }
    /**
     * Gets the class name
     * @returns the string "Polar"
     */
    getClassName() {
        return "Polar";
    }
    /**
     * Converts the current polar to a string
     * @returns the current polar as a string
     */
    toString() {
        return JSON.stringify(this);
    }
    /**
     * Converts the current polar to an array
     * @returns the current polar as an array
     */
    asArray() {
        return [this.radius, this.theta];
    }
    /**
     * Adds the current Polar and the given Polar and stores the result
     * @param polar the polar to add
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    addToRef(polar, ref) {
        ref.radius = this.radius + polar.radius;
        ref.theta = this.theta + polar.theta;
        return ref;
    }
    /**
     * Adds the current Polar and the given Polar
     * @param polar the polar to add
     * @returns the sum polar
     */
    add(polar) {
        const ref = new Polar(0, 0);
        this.addToRef(polar, ref);
        return ref;
    }
    /**
     * Adds the given polar to the current polar
     * @param polar the polar to add
     * @returns the current polar
     */
    addInPlace(polar) {
        this.addToRef(polar, this);
        return this;
    }
    /**
     * Adds the provided values to the current polar
     * @param radius the amount to add to the radius
     * @param theta the amount to add to the theta
     * @returns the current polar
     */
    addInPlaceFromFloats(radius, theta) {
        this.radius += radius;
        this.theta += theta;
        return this;
    }
    /**
     * Subtracts the given Polar from the current Polar and stores the result
     * @param polar the polar to subtract
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    subtractToRef(polar, ref) {
        ref.radius = this.radius - polar.radius;
        ref.theta = this.theta - polar.theta;
        return ref;
    }
    /**
     * Subtracts the given Polar from the current Polar
     * @param polar the polar to subtract
     * @returns the difference polar
     */
    subtract(polar) {
        const ref = new Polar(0, 0);
        this.subtractToRef(polar, ref);
        return ref;
    }
    /**
     * Subtracts the given Polar from the current Polar
     * @param polar the polar to subtract
     * @returns the current polar
     */
    subtractInPlace(polar) {
        this.subtractToRef(polar, this);
        return this;
    }
    /**
     * Subtracts the given floats from the current polar
     * @param radius the amount to subtract from the radius
     * @param theta the amount to subtract from the theta
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    subtractFromFloatsToRef(radius, theta, ref) {
        ref.radius = this.radius - radius;
        ref.theta = this.theta - theta;
        return ref;
    }
    /**
     * Subtracts the given floats from the current polar
     * @param radius the amount to subtract from the radius
     * @param theta the amount to subtract from the theta
     * @returns the difference polar
     */
    subtractFromFloats(radius, theta) {
        const ref = new Polar(0, 0);
        this.subtractFromFloatsToRef(radius, theta, ref);
        return ref;
    }
    /**
     * Multiplies the given Polar with the current Polar and stores the result
     * @param polar the polar to multiply
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    multiplyToRef(polar, ref) {
        ref.radius = this.radius * polar.radius;
        ref.theta = this.theta * polar.theta;
        return ref;
    }
    /**
     * Multiplies the given Polar with the current Polar
     * @param polar the polar to multiply
     * @returns the product polar
     */
    multiply(polar) {
        const ref = new Polar(0, 0);
        this.multiplyToRef(polar, ref);
        return ref;
    }
    /**
     * Multiplies the given Polar with the current Polar
     * @param polar the polar to multiply
     * @returns the current polar
     */
    multiplyInPlace(polar) {
        this.multiplyToRef(polar, this);
        return this;
    }
    /**
     * Divides the current Polar by the given Polar and stores the result
     * @param polar the polar to divide
     * @param ref the polar to store the result in
     * @returns the updated ref
     */
    divideToRef(polar, ref) {
        ref.radius = this.radius / polar.radius;
        ref.theta = this.theta / polar.theta;
        return ref;
    }
    /**
     * Divides the current Polar by the given Polar
     * @param polar the polar to divide
     * @returns the quotient polar
     */
    divide(polar) {
        const ref = new Polar(0, 0);
        this.divideToRef(polar, ref);
        return ref;
    }
    /**
     * Divides the current Polar by the given Polar
     * @param polar the polar to divide
     * @returns the current polar
     */
    divideInPlace(polar) {
        this.divideToRef(polar, this);
        return this;
    }
    /**
     * Clones the current polar
     * @returns a clone of the current polar
     */
    clone() {
        return new Polar(this.radius, this.theta);
    }
    /**
     * Copies the source polar into the current polar
     * @param source the polar to copy from
     * @returns the current polar
     */
    copyFrom(source) {
        this.radius = source.radius;
        this.theta = source.theta;
        return this;
    }
    /**
     * Copies the given values into the current polar
     * @param radius the radius to use
     * @param theta the theta to use
     * @returns the current polar
     */
    copyFromFloats(radius, theta) {
        this.radius = radius;
        this.theta = theta;
        return this;
    }
    /**
     * Scales the current polar and stores the result
     * @param scale defines the multiplication factor
     * @param ref where to store the result
     * @returns the updated ref
     */
    scaleToRef(scale, ref) {
        ref.radius = this.radius * scale;
        ref.theta = this.theta * scale;
        return ref;
    }
    /**
     * Scales the current polar and returns a new polar with the scaled coordinates
     * @param scale defines the multiplication factor
     * @returns the scaled polar
     */
    scale(scale) {
        const ref = new Polar(0, 0);
        this.scaleToRef(scale, ref);
        return ref;
    }
    /**
     * Scales the current polar
     * @param scale defines the multiplication factor
     * @returns the current polar
     */
    scaleInPlace(scale) {
        this.scaleToRef(scale, this);
        return this;
    }
    /**
     * Sets the values of the current polar
     * @param radius the new radius
     * @param theta the new theta
     * @returns the current polar
     */
    set(radius, theta) {
        this.radius = radius;
        this.theta = theta;
        return this;
    }
    /**
     * Sets the values of the current polar
     * @param value the new values
     * @returns the current polar
     */
    setAll(value) {
        this.set(value, value);
        return this;
    }
    /**
     * Gets the rectangular coordinates of the current Polar
     * @param ref the reference to assign the result
     * @returns the updated reference
     */
    toVector2ToRef(ref) {
        const x = this.radius * Math.cos(this.theta);
        const y = this.radius * Math.sin(this.theta);
        ref.set(x, y);
        return ref;
    }
    /**
     * Gets the rectangular coordinates of the current Polar
     * @returns the rectangular coordinates
     */
    toVector2() {
        const ref = new Vector2(0, 0);
        return this.toVector2ToRef(ref);
    }
    /**
     * Converts a given Vector2 to its polar coordinates
     * @param v the Vector2 to convert
     * @param ref the reference to assign the result
     * @returns the updated reference
     */
    static FromVector2ToRef(v, ref) {
        const theta = Math.sign(v.y) * Math.acos(v.x / v.length());
        ref.radius = v.length();
        ref.theta = theta;
        return ref;
    }
    /**
     * Converts a given Vector2 to its polar coordinates
     * @param v the Vector2 to convert
     * @returns a Polar
     */
    static FromVector2(v) {
        const polar = new Polar(0, 0);
        Polar.FromVector2ToRef(v, polar);
        return polar;
    }
    /**
     * Converts an array of floats to a polar
     * @param array the array to convert
     * @returns the converted polar
     */
    static FromArray(array) {
        return new Polar(array[0], array[1]);
    }
}
/**
 * Class used for (radius, theta, phi) vector representation.
 */
export class Spherical {
    /**
     * Creates a new Spherical object from the given spherical coordinates
     * @param radius spherical radius
     * @param theta angle from positive y axis to radial line from 0 to PI (vertical)
     * @param phi angle from positive x axis measured anticlockwise from -PI to PI (horizontal)
     */
    constructor(radius, theta, phi) {
        this.radius = radius;
        this.theta = theta;
        this.phi = phi;
        this.radius = radius;
        this.theta = theta;
        this.phi = phi;
    }
    /**
     * Gets the class name
     * @returns the string "Spherical"
     */
    getClassName() {
        return "Spherical";
    }
    /**
     * Converts the current spherical to a string
     * @returns the current spherical as a string
     */
    toString() {
        return JSON.stringify(this);
    }
    /**
     * Converts the current spherical to an array
     * @returns the current spherical as an array
     */
    asArray() {
        return [this.radius, this.theta, this.phi];
    }
    /**
     * Adds the current Spherical and the given Spherical and stores the result
     * @param spherical the spherical to add
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    addToRef(spherical, ref) {
        ref.radius = this.radius + spherical.radius;
        ref.theta = this.theta + spherical.theta;
        ref.phi = this.phi + spherical.phi;
        return ref;
    }
    /**
     * Adds the current Spherical and the given Spherical
     * @param spherical the spherical to add
     * @returns the sum spherical
     */
    add(spherical) {
        const ref = new Spherical(0, 0, 0);
        this.addToRef(spherical, ref);
        return ref;
    }
    /**
     * Adds the given spherical to the current spherical
     * @param spherical the spherical to add
     * @returns the current spherical
     */
    addInPlace(spherical) {
        this.addToRef(spherical, this);
        return this;
    }
    /**
     * Adds the provided values to the current spherical
     * @param radius the amount to add to the radius
     * @param theta the amount to add to the theta
     * @param phi the amount to add to the phi
     * @returns the current spherical
     */
    addInPlaceFromFloats(radius, theta, phi) {
        this.radius += radius;
        this.theta += theta;
        this.phi += phi;
        return this;
    }
    /**
     * Subtracts the given Spherical from the current Spherical and stores the result
     * @param spherical the spherical to subtract
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    subtractToRef(spherical, ref) {
        ref.radius = this.radius - spherical.radius;
        ref.theta = this.theta - spherical.theta;
        ref.phi = this.phi - spherical.phi;
        return ref;
    }
    /**
     * Subtracts the given Spherical from the current Spherical
     * @param spherical the spherical to subtract
     * @returns the difference spherical
     */
    subtract(spherical) {
        const ref = new Spherical(0, 0, 0);
        this.subtractToRef(spherical, ref);
        return ref;
    }
    /**
     * Subtracts the given Spherical from the current Spherical
     * @param spherical the spherical to subtract
     * @returns the current spherical
     */
    subtractInPlace(spherical) {
        this.subtractToRef(spherical, this);
        return this;
    }
    /**
     * Subtracts the given floats from the current spherical
     * @param radius the amount to subtract from the radius
     * @param theta the amount to subtract from the theta
     * @param phi the amount to subtract from the phi
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    subtractFromFloatsToRef(radius, theta, phi, ref) {
        ref.radius = this.radius - radius;
        ref.theta = this.theta - theta;
        ref.phi = this.phi - phi;
        return ref;
    }
    /**
     * Subtracts the given floats from the current spherical
     * @param radius the amount to subtract from the radius
     * @param theta the amount to subtract from the theta
     * @param phi the amount to subtract from the phi
     * @returns the difference spherical
     */
    subtractFromFloats(radius, theta, phi) {
        const ref = new Spherical(0, 0, 0);
        this.subtractFromFloatsToRef(radius, theta, phi, ref);
        return ref;
    }
    /**
     * Multiplies the given Spherical with the current Spherical and stores the result
     * @param spherical the spherical to multiply
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    multiplyToRef(spherical, ref) {
        ref.radius = this.radius * spherical.radius;
        ref.theta = this.theta * spherical.theta;
        ref.phi = this.phi * spherical.phi;
        return ref;
    }
    /**
     * Multiplies the given Spherical with the current Spherical
     * @param spherical the spherical to multiply
     * @returns the product spherical
     */
    multiply(spherical) {
        const ref = new Spherical(0, 0, 0);
        this.multiplyToRef(spherical, ref);
        return ref;
    }
    /**
     * Multiplies the given Spherical with the current Spherical
     * @param spherical the spherical to multiply
     * @returns the current spherical
     */
    multiplyInPlace(spherical) {
        this.multiplyToRef(spherical, this);
        return this;
    }
    /**
     * Divides the current Spherical by the given Spherical and stores the result
     * @param spherical the spherical to divide
     * @param ref the spherical to store the result in
     * @returns the updated ref
     */
    divideToRef(spherical, ref) {
        ref.radius = this.radius / spherical.radius;
        ref.theta = this.theta / spherical.theta;
        ref.phi = this.phi / spherical.phi;
        return ref;
    }
    /**
     * Divides the current Spherical by the given Spherical
     * @param spherical the spherical to divide
     * @returns the quotient spherical
     */
    divide(spherical) {
        const ref = new Spherical(0, 0, 0);
        this.divideToRef(spherical, ref);
        return ref;
    }
    /**
     * Divides the current Spherical by the given Spherical
     * @param spherical the spherical to divide
     * @returns the current spherical
     */
    divideInPlace(spherical) {
        this.divideToRef(spherical, this);
        return this;
    }
    /**
     * Clones the current spherical
     * @returns a clone of the current spherical
     */
    clone() {
        return new Spherical(this.radius, this.theta, this.phi);
    }
    /**
     * Copies the source spherical into the current spherical
     * @param source the spherical to copy from
     * @returns the current spherical
     */
    copyFrom(source) {
        this.radius = source.radius;
        this.theta = source.theta;
        this.phi = source.phi;
        return this;
    }
    /**
     * Copies the given values into the current spherical
     * @param radius the radius to use
     * @param theta the theta to use
     * @param phi the phi to use
     * @returns the current spherical
     */
    copyFromFloats(radius, theta, phi) {
        this.radius = radius;
        this.theta = theta;
        this.phi = phi;
        return this;
    }
    /**
     * Scales the current spherical and stores the result
     * @param scale defines the multiplication factor
     * @param ref where to store the result
     * @returns the updated ref
     */
    scaleToRef(scale, ref) {
        ref.radius = this.radius * scale;
        ref.theta = this.theta * scale;
        ref.phi = this.phi * scale;
        return ref;
    }
    /**
     * Scales the current spherical and returns a new spherical with the scaled coordinates
     * @param scale defines the multiplication factor
     * @returns the scaled spherical
     */
    scale(scale) {
        const ref = new Spherical(0, 0, 0);
        this.scaleToRef(scale, ref);
        return ref;
    }
    /**
     * Scales the current spherical
     * @param scale defines the multiplication factor
     * @returns the current spherical
     */
    scaleInPlace(scale) {
        this.scaleToRef(scale, this);
        return this;
    }
    /**
     * Sets the values of the current spherical
     * @param radius the new radius
     * @param theta the new theta
     * @param phi the new phi
     * @returns the current spherical
     */
    set(radius, theta, phi) {
        this.radius = radius;
        this.theta = theta;
        this.phi = phi;
        return this;
    }
    /**
     * Sets the values of the current spherical
     * @param value the new values
     * @returns the current spherical
     */
    setAll(value) {
        this.set(value, value, value);
        return this;
    }
    /**
     * Assigns the rectangular coordinates of the current Spherical to a Vector3
     * @param ref the Vector3 to update
     * @returns the updated Vector3
     */
    toVector3ToRef(ref) {
        const x = this.radius * Math.sin(this.theta) * Math.cos(this.phi);
        const y = this.radius * Math.cos(this.theta);
        const z = this.radius * Math.sin(this.theta) * Math.sin(this.phi);
        ref.set(x, y, z);
        return ref;
    }
    /**
     * Gets a Vector3 from the current spherical coordinates
     * @returns the (x, y,z) form of the current Spherical
     */
    toVector3() {
        const ref = new Vector3(0, 0, 0);
        return this.toVector3ToRef(ref);
    }
    /**
     * Assigns the spherical coordinates from a Vector3
     * @param vector the vector to convert
     * @param ref the Spherical to update
     * @returns the updated ref
     */
    static FromVector3ToRef(vector, ref) {
        ref.radius = vector.length();
        ref.theta = Math.acos(vector.y / ref.radius);
        ref.phi = Math.atan2(vector.z, vector.x);
        return ref;
    }
    /**
     * Gets a Spherical from a Vector3
     * @param vector defines the vector in (x, y, z) coordinate space
     * @returns a new Spherical
     */
    static FromVector3(vector) {
        const spherical = new Spherical(0, 0, 0);
        Spherical.FromVector3ToRef(vector, spherical);
        return spherical;
    }
    /**
     * Converts an array of floats to a spherical
     * @param array the array to convert
     * @returns the converted spherical
     */
    static FromArray(array) {
        return new Spherical(array[0], array[1], array[2]);
    }
}
//# sourceMappingURL=math.polar.js.map