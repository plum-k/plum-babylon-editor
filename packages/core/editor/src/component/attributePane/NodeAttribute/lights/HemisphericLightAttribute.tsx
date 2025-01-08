import {Fragment} from "react";
import {ColorItem, InputNumberItem, Vector3Item} from "@plum-render/common-ui";

export default function HemisphericLightAttribute() {

    return (
        <Fragment>
            <Vector3Item label="方向" basePropertyName={["direction"]} toDegrees/>
            <InputNumberItem label="强度" name={["intensity"]}/>
            <ColorItem label="漫反射颜色" name={["diffuse"]}/>
            <ColorItem label="地面颜色" name={["groundColor"]}/>
        </Fragment>
    )
}
