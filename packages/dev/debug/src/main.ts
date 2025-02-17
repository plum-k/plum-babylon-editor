import {Viewer} from "@plum-render/babylon-sdk";
import {
    Color3,
    CreateGreasedLine, Curve3, GreasedLineMeshColorDistribution,
    GreasedLineMeshColorDistributionType,
    GreasedLineTools,
    Vector3
} from "@babylonjs/core";

let viewer = await Viewer.create("app", {
    isCreateDefaultLight: true,
    isCreateDefaultEnvironment: true,
});

viewer.initSubject.subscribe(() => {
    console.log("场景初始化完成");
})


// simple line
const points1 =
    [
        -1, 10, 0,
        1, 10, 0
    ]
const line1 = BABYLON.CreateGreasedLine("line1", { points: points1 })

//

// two lines with color
const points2 = [
    [
        -1, 9, 0,
        1, 9, 0
    ], [
        2, 9, 0,
        4, 9, 0
    ]]
const line2 = BABYLON.CreateGreasedLine("line2", { points: points2 }, { color: BABYLON.Color3.Red() })

//

// one line with different colors with COLOR_DISTRIBUTION_TYPE_LINE
// one color per point is required
// the colors are divided along the line
const points3 =
    [
        -1, 8, 0,
        0, 8, 0,
        1, 7, 0,
    ]
const colors3 = [BABYLON.Color3.Green(), BABYLON.Color3.Yellow(), BABYLON.Color3.Purple()]
const line3 = BABYLON.CreateGreasedLine("line3",
    { points: points3 },
    { width: 0.2, colors: colors3, useColors: true, colorDistributionType: BABYLON.GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_LINE })

//

// one line with different colors with COLOR_DISTRIBUTION_TYPE_SEGMENT (default value)
// one color per segment is required
// the colors are divided between segments
const colors4 = [BABYLON.Color3.Teal(), BABYLON.Color3.Blue()]
const points4 =
    [
        2, 8, 0,
        3, 8, 0,
        4, 7, 0
    ]
const line4 = BABYLON.CreateGreasedLine("line4",
    { points: points4 },
    { width: 0.2, colors: colors4, useColors: true })

//

// two lines with different colors
// you have to insert a dummy color between the colors of the lines in the color table
colors5 = [BABYLON.Color3.Red(), BABYLON.Color3.BlackReadOnly, BABYLON.Color3.Blue()]
const points5 = [
    [
        -1, 6, 0,
        1, 6, 0
    ], [
        2, 6, 0,
        4, 6, 0
    ]]
const line5 = BABYLON.CreateGreasedLine("line5",
    { points: points5 },
    { colors: colors5, useColors: true })

//

// line widths
const points6 = BABYLON.GreasedLineTools.SegmentizeLineBySegmentCount(BABYLON.GreasedLineTools.ToVector3Array(
    [
        -4, 5, 0,
        4, 5, 0
    ]), 5)

const widths6 = [1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1]
const line6 = BABYLON.CreateGreasedLine("line6",
    { points: points6, widths: widths6 }, { width: 0.2 })

//

// line widths
const points7 = BABYLON.GreasedLineTools.SegmentizeLineBySegmentCount(BABYLON.GreasedLineTools.ToVector3Array(
    [
        -4, 4, 0,
        4, 4, 0
    ]), 5)
const widths7 = [1, 1, 2, 1, 3, 1, 3, 1, 2, 1, 1, 1]
const line7 = BABYLON.CreateGreasedLine("line7",
    { points: points7, widths: widths7 }, { width: 0.2, color: BABYLON.Color3.Gray() })
