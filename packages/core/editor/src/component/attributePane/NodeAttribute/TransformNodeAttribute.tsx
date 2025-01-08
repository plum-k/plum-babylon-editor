import {Fragment} from "react";
import {BoolItem, InputNumberItem, Vector3Item} from "@plum-render/common-ui";

export default function TransformNodeAttribute() {
    return (
        <Fragment>
            <BoolItem name={["isEnabled"]} label="是否启用"/>
            <BoolItem name={["isPickable"]} label="是否锁定"/>
            <InputNumberItem name={["geometryUniqueId"]} label="网格id"/>
            <Vector3Item basePropertyName={["position"]} label="位置"/>
            <Vector3Item
                basePropertyName={["rotation"]}
                label="旋转"
                toDegrees
            />
            <Vector3Item basePropertyName={["scaling"]} label="缩放"/>
            {/*<JsonItem itemProps={{label: "自定义数据", name: "metadata"}}/>*/}
        </Fragment>
    )
}

