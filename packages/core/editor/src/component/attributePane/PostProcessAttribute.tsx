import {Fragment, useEffect, useMemo} from "react";
import {Collapse, CollapseProps, Form, FormProps} from "antd";
import {FieldData} from "rc-field-form/lib/interface";
import {
    BoolItem,
    ColorItem,
    InputItem,
    NumberSliderItem,
    ObjectAttributeProvider,
    SelectItem,
    TextItem,
    Vector2Item
} from "../../common-ui";
import {useViewer} from "../../store";
import {DepthOfFieldEffectBlurLevel, ImageProcessingConfiguration} from "@babylonjs/core";
import {set} from "lodash-es";

export function PostProcessAttribute() {
    const [form] = Form.useForm();
    const viewer = useViewer()
    useEffect(() => {
    }, [viewer])

    const onFieldsChange: FormProps['onFieldsChange'] = (changedFields: FieldData[], allFields: FieldData[]) => {
        const changedField = changedFields[0];
        const name = changedField.name;
        const value = changedField.value;
        const firstName = name[0] as string;

        console.log(`${name}: ${value}`)

        let defaultRenderingPipeline = viewer?.postProcessManager.defaultRenderingPipeline;
        if (defaultRenderingPipeline) {
            set(defaultRenderingPipeline, name, value)
        }
    }
    const items = useMemo(() => {
        const list: CollapseProps['items'] = [];

        list.push({
            key: '辉光',
            label: '辉光',
            children: <Fragment>
                <BoolItem name={["bloomEnabled"]} label="开启"/>
                <NumberSliderItem name={"bloomThreshold"} label={"阈值"} min={0} max={2} step={0.01}/>
                <NumberSliderItem name={"bloomWeight"} label={"权重"} min={0} max={1} step={0.05}/>
                <NumberSliderItem name={"bloomKernel"} label={"核大小"} min={0} max={128} step={1}/>
                <NumberSliderItem name={"bloomScale"} label={"缩放"} min={0} max={1} step={0.25}/>
            </Fragment>
        });

        list.push({
            key: '色差',
            label: '色差',
            children: <Fragment>
                <BoolItem name={["bloomEnabled"]} label="开启"/>
                <NumberSliderItem name={"aberrationAmount"} label={"色差量"} min={0} max={128} step={0.01}/>
                <NumberSliderItem name={"radialIntensity"} label={"径向强度"} min={0} max={1} step={0.01}/>
                <Vector2Item basePropertyName={["centerPosition"]} label={"中心位置"}/>
                <Vector2Item basePropertyName={["direction"]} label={"方向"}/>
            </Fragment>
        });

        list.push({
            key: '景深',
            label: '景深',
            children: <Fragment>
                <BoolItem name={["depthOfFieldEnabled"]} label="启用"/>
                <NumberSliderItem name={"focalLength"} label={"焦距"} min={0} max={2} step={0.01}/>
                <NumberSliderItem name={"fStop"} label={"光圈值"} min={0} max={32} step={0.1}/>
                <NumberSliderItem name={"focusDistance"} label={"对焦距离"} min={0} max={128} step={0.1}/>
                <NumberSliderItem name={"lensSize"} label={"镜头大小"} min={0} max={1000} step={1}/>
                <SelectItem name={["depthOfFieldBlurLevel"]} label="模糊级别" fieldProps={{
                    options: [
                        {label: "低", value: DepthOfFieldEffectBlurLevel.Low},
                        {label: "中", value: DepthOfFieldEffectBlurLevel.Medium},
                        {label: "高", value: DepthOfFieldEffectBlurLevel.High},
                    ]
                }}/>
            </Fragment>
        });

        list.push({
            key: 'FXAA',
            label: 'FXAA',
            children: <Fragment>
                <BoolItem name={["fxaaEnabled"]} label="启用"/>
            </Fragment>
        });

        list.push({
            key: '发光层',
            label: '发光层',
            children: <Fragment>
                <BoolItem name={["glowLayerEnabled"]} label="启用"/>
                <NumberSliderItem name={["blurKernelSize"]} label="内核大小" min={0} max={128} step={1}/>
                <NumberSliderItem name={["intensity"]} label="强度" min={0} max={10} step={0.1}/>
            </Fragment>
        });

        list.push({
            key: '颗粒',
            label: '颗粒',
            children: <Fragment>
                <BoolItem name={["grainEnabled"]} label="启用"/>
                <BoolItem name={["grain", "animated"]} label="动画"/>
                <NumberSliderItem name={["grain", "intensity"]} label="强度" min={0} max={50} step={0.1}/>
            </Fragment>
        });


        list.push({
            key: '图像处理',
            label: '图像处理',
            children: <Fragment>
                <BoolItem name={["imageProcessingEnabled"]} label="启用"/>
                <NumberSliderItem name={["imageProcessing", "contrast"]} label="对比度" min={0} max={4} step={0.1}/>
                <NumberSliderItem name={["imageProcessing", "exposure"]} label="曝光" min={0} max={4} step={0.1}/>
                <SelectItem name={["imageProcessing", "toneMappingType"]} label="色调映射类型" fieldProps={{
                    options: [
                        {label: "标准", value: ImageProcessingConfiguration.TONEMAPPING_STANDARD},
                        {label: "ACES", value: ImageProcessingConfiguration.TONEMAPPING_ACES},
                        {label: "Khronos PBR 中性", value: ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL},
                    ]
                }}/>
                <BoolItem name={["imageProcessing", "vignetteEnabled"]} label="启用晕影"/>
                <NumberSliderItem name={["imageProcessing", "vignetteWeight"]} label="晕影权重" min={0} max={4}
                                  step={0.1}/>
                <NumberSliderItem name={["imageProcessing", "vignetteStretch"]} label="晕影拉伸" min={0} max={4}
                                  step={0.1}/>
                <NumberSliderItem name={["imageProcessing", "vignetteCameraFov"]} label="晕影相机视场" min={0} max={4}
                                  step={0.1}/>
                <NumberSliderItem name={["imageProcessing", "vignetteCenterX"]} label="晕影中心X" min={0} max={4}
                                  step={0.1}/>
                <NumberSliderItem name={["imageProcessing", "vignetteCenterY"]} label="晕影中心Y" min={0} max={4}
                                  step={0.1}/>

                <ColorItem name={["imageProcessing", "vignetteColor"]} label="晕影颜色"/>
                <SelectItem name={["imageProcessing", "vignetteBlendMode"]} label="晕影混合模式" fieldProps={{
                    options: [
                        {label: "乘法", value: ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY},
                        {label: "不透明", value: ImageProcessingConfiguration.VIGNETTEMODE_OPAQUE},
                    ]
                }}/>
                <BoolItem name={["imageProcessing", "ditheringEnabled"]} label="启用抖动"/>
                <NumberSliderItem name={["imageProcessing", "ditheringIntensity"]} label="抖动强度" min={0} max={4}
                                  step={0.1}/>
            </Fragment>
        });

        list.push({
            key: '锐化',
            label: '锐化',
            children: <Fragment>
                <BoolItem name={["sharpenEnabled"]} label="启用"/>
                <NumberSliderItem name={["sharpen", "colorAmount"]} label="颜色增强量" min={0} max={1} step={0.05}/>
                <NumberSliderItem name={["sharpen", "edgeAmount"]} label="边缘增强量" min={0} max={5} step={0.05}/>
            </Fragment>
        });

        return list
    }, [])
    return (
        <Fragment>
            <div className={"scrollable-div"}>
                <Form
                    form={form}
                    onFieldsChange={onFieldsChange}
                    name="PostProcessAttribute"
                    labelAlign="right"
                    labelWrap={true}
                    labelCol={{span: 8}}
                    wrapperCol={{span: 16}}
                >
                    <ObjectAttributeProvider value={{object: viewer?.postProcessManager.defaultRenderingPipeline}}>
                        <TextItem label={["类型"]} funName={"getClassName"}/>
                        <InputItem name={["name"]} label={["名称"]}/>
                        <NumberSliderItem label={"采样"} name={"samples"}/>
                        <Collapse items={items} bordered={false} ghost/>
                    </ObjectAttributeProvider>
                </Form>
            </div>
        </Fragment>
    )
}

