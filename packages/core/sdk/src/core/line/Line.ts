import {defaults} from "lodash-es";
import {Color3, CreateGreasedLine, GreasedLinePoints} from "@babylonjs/core";

export interface ILine {
    name: string;
}

export default class Line {
    options: ILine;
    points: GreasedLinePoints;
    line;
    points!: GreasedLinePoints;
    color!: Color3

    constructor(options: ILine) {
        this.options = defaults(options, {});
    }


    setPoints(points: GreasedLinePoints) {
        this.points = points;
    }


    build() {
        this.line = CreateGreasedLine(this.options.name, {
                points: this.points
            },
            {
                color: this.color

            }
        )

    }
}