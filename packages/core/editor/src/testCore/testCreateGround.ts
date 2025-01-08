import {Color3, MeshBuilder, StandardMaterial, Texture} from "@babylonjs/core";

const testCreateGround = (scene) => {
    var sphere = MeshBuilder.CreateSphere("ground", {diameter: 2, segments: 32}, scene);
    // Move the sphere upward 1/2 its height
    let startPos = 2;
    sphere.position.y = startPos;

    // Our built-in 'ground' shape.
    var ground = MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);
    var groundMaterial = new StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new Color3(0.5, 0.8, 0.5); // RGB for a greenish color
    ground.material = groundMaterial;
    groundMaterial.bumpTexture = new Texture("./normal.jpg", scene);

    ground.parent = sphere;
}
