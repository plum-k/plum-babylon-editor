import { Mesh } from "../mesh.js";
import { CreateSphere } from "../Builders/sphereBuilder.js";
import { CreateDisc } from "./discBuilder.js";
/**
 * Creates a hemisphere mesh
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the hemisphere mesh
 */
export function CreateHemisphere(name, options = {}, scene) {
    if (!options.diameter) {
        options.diameter = 1;
    }
    if (!options.segments) {
        options.segments = 16;
    }
    const halfSphere = CreateSphere("", { slice: 0.5, diameter: options.diameter, segments: options.segments }, scene);
    const disc = CreateDisc("", { radius: options.diameter / 2, tessellation: options.segments * 3 + (4 - options.segments) }, scene);
    disc.rotation.x = -Math.PI / 2;
    disc.parent = halfSphere;
    const merged = Mesh.MergeMeshes([disc, halfSphere], true);
    merged.name = name;
    return merged;
}
/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the function directly from the module
 */
export const HemisphereBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateHemisphere,
};
/**
 * Creates a hemispheric light
 * @param name
 * @param segments
 * @param diameter
 * @param scene
 * @returns the mesh
 */
Mesh.CreateHemisphere = (name, segments, diameter, scene) => {
    const options = {
        segments: segments,
        diameter: diameter,
    };
    return CreateHemisphere(name, options, scene);
};
//# sourceMappingURL=hemisphereBuilder.js.map