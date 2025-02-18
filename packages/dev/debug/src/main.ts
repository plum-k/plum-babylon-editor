import {CSG, Viewer} from "@plum-render/babylon-sdk";
import {Pane} from "tweakpane";
import {Color3} from "@babylonjs/core";

let viewer = await Viewer.create("app", {
    isCreateDefaultLight: true,
    isCreateDefaultEnvironment: true,
});

CSG.init();

const mOuter = MeshBuilder.CreateCylinder(
    "mOuter",
    {
        diameter: 5,
        height: 2,
    },
    scene,
);
// Create the inner wall using a Tube mesh
const mInner = MeshBuilder.CreateCylinder(
    "mOuter",
    {
        diameter: 3,
        height: 3,
    },
    scene,
);
// Create CSG objects from each mesh
const outerCSG = CSG2.FromMesh(mOuter);
const innerCSG = CSG2.FromMesh(mInner);

// Create a new CSG object by subtracting the inner tube from the outer cylinder
const pipeCSG = outerCSG.subtract(innerCSG);

// Create the resulting mesh from the new CSG object
const mPipe = pipeCSG.toMesh("mPipe", scene);

// Dispose of the meshes, no longer needed
mInner.dispose();
mOuter.dispose();

outerCSG.dispose();
innerCSG.dispose();





