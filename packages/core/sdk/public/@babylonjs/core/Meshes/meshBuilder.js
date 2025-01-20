/* eslint-disable @typescript-eslint/naming-convention */
import { CreateRibbon } from "./Builders/ribbonBuilder.js";
import { CreateDisc } from "./Builders/discBuilder.js";
import { CreateBox } from "./Builders/boxBuilder.js";
import { CreateTiledBox } from "./Builders/tiledBoxBuilder.js";
import { CreateSphere } from "./Builders/sphereBuilder.js";
import { CreateCylinder } from "./Builders/cylinderBuilder.js";
import { CreateTorus } from "./Builders/torusBuilder.js";
import { CreateTorusKnot } from "./Builders/torusKnotBuilder.js";
import { CreateDashedLines, CreateLineSystem, CreateLines } from "./Builders/linesBuilder.js";
import { CreatePolygon, ExtrudePolygon } from "./Builders/polygonBuilder.js";
import { ExtrudeShape, ExtrudeShapeCustom } from "./Builders/shapeBuilder.js";
import { CreateLathe } from "./Builders/latheBuilder.js";
import { CreatePlane } from "./Builders/planeBuilder.js";
import { CreateTiledPlane } from "./Builders/tiledPlaneBuilder.js";
import { CreateGround, CreateGroundFromHeightMap, CreateTiledGround } from "./Builders/groundBuilder.js";
import { CreateTube } from "./Builders/tubeBuilder.js";
import { CreatePolyhedron } from "./Builders/polyhedronBuilder.js";
import { CreateIcoSphere } from "./Builders/icoSphereBuilder.js";
import { CreateDecal } from "./Builders/decalBuilder.js";
import { CreateCapsule } from "./Builders/capsuleBuilder.js";
import { CreateGeodesic } from "./Builders/geodesicBuilder.js";
import { CreateGoldberg } from "./Builders/goldbergBuilder.js";
import { CreateText } from "./Builders/textBuilder.js";
/**
 * Class containing static functions to help procedurally build meshes
 */
export const MeshBuilder = {
    CreateBox,
    CreateTiledBox,
    CreateSphere,
    CreateDisc,
    CreateIcoSphere,
    CreateRibbon,
    CreateCylinder,
    CreateTorus,
    CreateTorusKnot,
    CreateLineSystem,
    CreateLines,
    CreateDashedLines,
    ExtrudeShape,
    ExtrudeShapeCustom,
    CreateLathe,
    CreateTiledPlane,
    CreatePlane,
    CreateGround,
    CreateTiledGround,
    CreateGroundFromHeightMap,
    CreatePolygon,
    ExtrudePolygon,
    CreateTube,
    CreatePolyhedron,
    CreateGeodesic,
    CreateGoldberg,
    CreateDecal,
    CreateCapsule,
    CreateText,
};
//# sourceMappingURL=meshBuilder.js.map