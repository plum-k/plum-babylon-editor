import {ProjectionTransform, Viewer} from "@plum-render/babylon-sdk";
import {MeshBuilder} from "@babylonjs/core";

const tesProjection = (viewer: Viewer) => {

    let projectionTransform = new ProjectionTransform([116.60008205485568, 40.05554519881497])

    let cc = projectionTransform.project(116.569387, 40.10204)
    console.log(cc)

    let box = MeshBuilder.CreateBox("box", {width: 1, height: 1, depth: 1}, viewer.scene)
    box.position.set(cc[0], 10, cc[1])
    box.scaling.set(10, 10, 10)

    let cc1 = projectionTransform.project(116.617965, 40.058907)
    let box1 = MeshBuilder.CreateBox("box1", {width: 1, height: 1, depth: 1}, viewer.scene)
    box1.position.set(cc1[0], 10, cc1[1])
    box1.scaling.set(10, 10, 10)

}
// 12979861.76080045,4874017.242468582
export default tesProjection