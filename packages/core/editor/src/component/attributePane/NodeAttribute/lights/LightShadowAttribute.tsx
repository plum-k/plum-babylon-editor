import {Fragment, useEffect, useMemo, useState} from "react";
import {BoolItem, InputNumberItem, SelectItem} from "@plum-render/common-ui";
import {useSelectObject3D, useViewer} from "../../../../store";
import {Button} from "antd";
import {CascadedShadowGenerator, PointLight, ShadowGenerator} from "@babylonjs/core";

export interface PointLightShadowAttributeProps {
}

interface ShadowState {
    csmGenerator: boolean,
    generator: ShadowGenerator | CascadedShadowGenerator | null
}

export default function LightShadowAttribute(props: PointLightShadowAttributeProps) {
    const viewer = useViewer()
    const selectObject3D = useSelectObject3D();
    const [animationsList, setAnimationsList] = useState<Array<any>>([])

    useEffect(() => {
        if (selectObject3D) {
            let light = selectObject3D as unknown as PointLight;
            const generator = (light.getShadowGenerator() as ShadowGenerator | CascadedShadowGenerator) || null;
            const csmGenerator = generator instanceof CascadedShadowGenerator;
        }
    }, [selectObject3D])

    const shadowState = useMemo(() => {
        let state: ShadowState = {
            csmGenerator: false,
            generator: null,
        };
        if (selectObject3D) {
            let light = selectObject3D as unknown as PointLight;
            state.generator = (light.getShadowGenerator() as ShadowGenerator | CascadedShadowGenerator) || null;
            state.csmGenerator = state.generator instanceof CascadedShadowGenerator;
        }
        return state;
    }, [selectObject3D])


    const createShadowGenerator = () => {

    }

    return (
        <Fragment>
            <BoolItem label="启用阴影" name={"shadowEnabled"}/>
            {!shadowState.csmGenerator && (
                <Fragment>
                    <InputNumberItem name={["shadowMinZ"]} label="阴影最小距离"/>
                    <InputNumberItem name={["shadowMaxZ"]} label="阴影最大距离"/>
                </Fragment>
            )}
            {shadowState.generator == null && (
                <Fragment>
                    <SelectItem
                        name={["generatorType"]}
                        label="生成类型"
                        fieldProps={{
                            options: [
                                {value: 0, label: "普通"},
                                {value: 1, label: '级联'},
                            ]
                        }}
                    />
                    <SelectItem
                        name="generatorType"
                        label="生成大小"
                        fieldProps={{
                            options: [
                                {label: "4096x4096", value: 4096},
                                {label: "2048x2048", value: 2048},
                                {label: "1024x1024", value: 1024},
                                {label: "512x512", value: 512},
                                {label: "256x256", value: 256},
                            ]
                        }}
                    />
                    <Button onClick={createShadowGenerator}>生成</Button>
                </Fragment>
            )}
            {shadowState.generator !== null && (
                <Fragment>
                </Fragment>
            )}
        </Fragment>
    )
}

