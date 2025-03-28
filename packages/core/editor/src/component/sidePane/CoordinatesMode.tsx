import {Fragment} from "react";
import {Select} from "antd";
import {GizmoCoordinatesMode} from "@babylonjs/core";
import {useViewer} from "../../store";

export interface ICoordinatesModeProps {

}

export function CoordinatesMode(props: ICoordinatesModeProps) {
    const viewer = useViewer()

    const handleChange = (value: GizmoCoordinatesMode) => {
        console.log(`selected ${value}`);
        if (viewer) {
            viewer.editor.gizmoManager.coordinatesMode = value
        }
    };

    return (
        <Fragment>
            <Select
                defaultValue={GizmoCoordinatesMode.Local}
                style={{width: 100, marginRight:"10px"}}
                onChange={handleChange}
                options={[
                    {value: GizmoCoordinatesMode.Local, label: '本地'},
                    {value: GizmoCoordinatesMode.World, label: '世界'},
                ]}
            />
        </Fragment>
    )
}