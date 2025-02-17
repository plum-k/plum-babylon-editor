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

const line1 = CreateGreasedLine("line1", {points: points1})

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
const line2 = CreateGreasedLine("line2", {points: points2}, {color: Color3.Red()})

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
const colors3 = [Color3.Green(), Color3.Yellow(), Color3.Purple()]
const line3 = CreateGreasedLine("line3",
    {points: points3},
    {
        width: 0.2,
        colors: colors3,
        useColors: true,
        colorDistributionType: GreasedLineMeshColorDistributionType.COLOR_DISTRIBUTION_TYPE_LINE
    })

//

// one line with different colors with COLOR_DISTRIBUTION_TYPE_SEGMENT (default value)
// one color per segment is required
// the colors are divided between segments
const colors4 = [Color3.Teal(), Color3.Blue()]
const points4 =
    [
        2, 8, 0,
        3, 8, 0,
        4, 7, 0
    ]
const line4 = CreateGreasedLine("line4",
    {points: points4},
    {width: 0.2, colors: colors4, useColors: true})

//

// two lines with different colors
// you have to insert a dummy color between the colors of the lines in the color table 

let colors5 = [Color3.Red(), Color3.BlackReadOnly, Color3.Blue()]
const points5 = [
    [
        -1, 6, 0,
        1, 6, 0
    ], [
        2, 6, 0,
        4, 6, 0
    ]]
const line5 = CreateGreasedLine("line5",
    {points: points5},
    {colors: colors5, useColors: true})

//

// line widths
const points6 = GreasedLineTools.SegmentizeLineBySegmentCount(GreasedLineTools.ToVector3Array([-4, 5, 0, 4, 5, 0]), 5)
const widths6 = [1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1]
const line6 = CreateGreasedLine("line6",
    {points: points6, widths: widths6}, {width: 0.2})

//

// line widths
const points7 = GreasedLineTools.SegmentizeLineBySegmentCount(GreasedLineTools.ToVector3Array(
    [
        -4, 4, 0,
        4, 4, 0
    ]), 5)
const widths7 = [1, 1, 2, 1, 3, 1, 3, 1, 2, 1, 1, 1]
const line7 = CreateGreasedLine("line7",
    {points: points7, widths: widths7}, {width: 0.2, color: Color3.Gray()})



const f = new Vector3(-0.5 + Math.random(), -0.5 + Math.random(), -0.5 + Math.random()).scale(20);
const s = new Vector3(-0.5 + Math.random(), -0.5 + Math.random(), -0.5 + Math.random()).scale(20);
const t = new Vector3(-0.5 + Math.random(), -0.5 + Math.random(), -0.5 + Math.random()).scale(20);

const colors = [Color3.Red(), Color3.Yellow(), Color3.Purple()]
const points = Curve3.ArcThru3Points(f, s, t).getPoints()

console.log(points)

const line = CreateGreasedLine("arc", { points },
    {
        width: 1,
        useColors: true,
        colors,
        colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_REPEAT
    })


const points1 = []
const colors1 = [Color3.Red(), Color3.Green(), Color3.Blue(), Color3.Yellow()]
for (let x = 0; x < 10; x += 0.25) {
    points1.push(new Vector3(x, Math.cos(x / 2), 0))
}
const width = 0.3

const line1 = CreateGreasedLine(
    'basic-line-1',
    {
        points: points1,
    },
    {
        colors: colors1,
        useColors: true,
        width,
        colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_START // Default
    },
    scene
)

//

const line2 = CreateGreasedLine(
    'basic-line-2',
    {
        points: points1.map(p => new Vector3(p.x, p.y - 2, p.z)),
    },
    {
        colors: colors1,
        useColors: true,
        width,
        colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_END,
    },
    scene
)
//

const line3 = CreateGreasedLine(
    'basic-line-3',
    {
        points: points1.map(p => new Vector3(p.x, p.y - 4, p.z)),
    },
    {
        colors: colors1,
        useColors: true,
        width,
        colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_EVEN
    },
    scene
)
//
const line4 = CreateGreasedLine(
    'basic-line-4',
    {
        points: points1.map(p => new Vector3(p.x, p.y - 6, p.z)),
    },
    {
        colors: colors1,
        useColors: true,
        width,
        colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_START_END
    },
    scene
)
//
const line5 = CreateGreasedLine(
    'basic-line-5',
    {
        points: points1.map(p => new Vector3(p.x, p.y - 8, p.z)),
    },
    {
        colors: colors1,
        useColors: true,
        width,
        colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_REPEAT
    },
    scene
)
//
const line6 = CreateGreasedLine(
    'basic-line-6',
    {
        points: points1.map(p => new Vector3(p.x, p.y - 10, p.z)),
    },
    {
        colors: colors1,
        useColors: true,
        width,
        colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_NONE
    },
    scene
)