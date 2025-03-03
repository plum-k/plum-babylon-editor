import {MeshBuilder, Vector3} from "@babylonjs/core";
import {Component, IComponentOptions} from "./Component";
import {isNil} from "lodash-es";


export interface IDrawLineOptions extends IComponentOptions {
}


export class DrawLine extends Component {
    constructor(options: IDrawLineOptions) {
        super(options);
        const {viewer} = options;
        const {scene, canvas} = viewer;
        // this.startLine();
        // this.test();
    }


    startLine() {
        let vectors: Array<Vector3> = []
        let lineOptions = {
            points: vectors,
            updatable: true,
            instance: undefined

        }

        let lines = MeshBuilder.CreateLines("lines", lineOptions, this.scene);
        this.eventManager.pointerUpLeftSubject.subscribe(value => {

            // let aaa = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
            // console.log(aaa)
            console.log(value)
            const {pickInfo} = value;
            if (isNil(pickInfo)) {
                return
            }
            // const {pickedPoint} = pickInfo;

            const pickedPoint = pickInfo.ray.origin;

            if (pickedPoint) {
                vectors.push(new Vector3(pickedPoint.x, pickedPoint.y, pickedPoint.z));
                if (vectors.length > 1) {
                    const newVectors = [...vectors]
                    const newOptions = {
                        points: newVectors,
                        updatable: true
                    }
                    lines.dispose()
                    lines = MeshBuilder.CreateLines("lines", newOptions);

                }
            }

        })
        this.eventManager.pointerDoubleTapSubject.subscribe(value => {
            const {pickInfo} = value;
            if (isNil(pickInfo)) {
                return
            }
            // const {pickedPoint} = pickInfo;
            const pickedPoint = pickInfo.ray.origin;
            if (lines && pickedPoint && vectors.length > 1) {
                vectors[vectors.length - 1].x = pickedPoint.x
                vectors[vectors.length - 1].y = pickedPoint.y
                vectors[vectors.length - 1].z = pickedPoint.z
                lineOptions.instance = lines
                lines = MeshBuilder.CreateLines("lines", lineOptions);
            }

        })
        this.eventManager.pointerMoveSubject.subscribe(value => {
            const {pickInfo} = value;
            if (isNil(pickInfo)) {
                return
            }
            // const {pickedPoint} = pickInfo;
            const pickedPoint = pickInfo.ray.origin;
            if (lines && pickedPoint && vectors.length > 1) {
                vectors[vectors.length - 1].x = pickedPoint.x
                vectors[vectors.length - 1].y = pickedPoint.y
                vectors[vectors.length - 1].z = pickedPoint.z
                lineOptions.instance = lines
                lines = MeshBuilder.CreateLines("lines", lineOptions);
            }

        })
    }
}

