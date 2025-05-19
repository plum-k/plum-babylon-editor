import {Vector3} from '@babylonjs/core';

export class Tool{
    static multiplyVectors(vector: Vector3, a: Vector3,b: Vector3 ){

        vector.x = a.x * b.x;
        vector.y = a.y * b.y;
        vector.z = a.z * b.z;
    }
}