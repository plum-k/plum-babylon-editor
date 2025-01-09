import {Fragment, useState} from "react";
import {Form} from "antd";
import {DescriptionsProps} from "antd/lib";

import {InputNumberItem, NumberSliderItem, SelectItem} from "@plum-render/common-ui";
import {useSelectObject3D, useViewer} from "../../../store";
import {Camera} from "@babylonjs/core";


export default function CameraAttribute() {
    
    const form = Form.useFormInstance();
    const viewer = useViewer()
    const [MeshInfo, setMeshInfo] = useState<DescriptionsProps['items']>([]);
    const selectObject3D = useSelectObject3D();
    let camera = selectObject3D as Camera;

    // const [mode, setMode] = useState(camera.mode);

    const nameValue = Form.useWatch('mode', form);

    // useEffect(() => {
    //     if (nameValue !== mode) {
    //         // setMode(nameValue)
    //     }
    // }, [nameValue])

    return (
        <Fragment>
            <SelectItem
                label="类型"
                name={["mode"]}
                fieldProps={{
                    options: [
                        {label: "透视", value: Camera.PERSPECTIVE_CAMERA},
                        {label: "正交", value: Camera.ORTHOGRAPHIC_CAMERA},
                    ]
                }}
            />
            <NumberSliderItem label="惯性" name={["inertia"]} min={0} max={1} step={0.01}/>
            <InputNumberItem label="近裁剪平面" name={["minZ"]}/>
            <InputNumberItem label="远裁剪平面" name={["maxZ"]}/>
            {
                camera.mode === Camera.PERSPECTIVE_CAMERA &&
                <NumberSliderItem label="视野" name={["fov"]} min={0.1} max={Math.PI} step={0.1}/>
            }
            {
                camera.mode === Camera.ORTHOGRAPHIC_CAMERA &&
                <Fragment>
                    <InputNumberItem label="左" name={["orthoLeft"]}/>
                    <InputNumberItem label="上" name={["orthoTop"]}/>
                    <InputNumberItem label="右" name={["orthoRight"]}/>
                    <InputNumberItem label="下" name={["orthoBottom"]}/>
                </Fragment>
            }
        </Fragment>
    )
}

