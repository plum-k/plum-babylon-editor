import {Fragment, useMemo, useState} from "react";
import {Collapse, CollapseProps, Form, FormProps} from "antd";
import {FieldData} from "rc-field-form/lib/interface";
import {isMesh} from "babylon-is";
import {useSelectKey, useSelectObject3D, useViewer} from "../../store";
import {
    BoolItem,
    ColorItem,
    InputItem,
    NumberSliderItem,
    ObjectAttributeProvider,
    SelectItem,
    TextItem,
    Vector2Item,
} from "@plum-render/common-ui";
import {Color3, Constants, Engine, Material, Mesh, PBRMaterial} from "@babylonjs/core";
import {AggregationColor} from "antd/es/color-picker/color";
import BabylonTextureItem from "../attributeItem/BabylonTextureItem.tsx";
import {isAggregationColor} from "../../tool/isAggregationColor.ts";
import {get, invoke} from "lodash-es";
import {useForceUpdate} from "../../hooks/useForceUpdate.ts";
import EmptyState from "../Empty.tsx";

export default function MaterialAttribute() {
    const viewer = useViewer()
    const selectObject3D = useSelectObject3D();
    const selectKey = useSelectKey();
    const [materialList, setMaterialList] = useState<any[]>([]);
    const [selectMaterial, setSelectMaterial] = useState<any>({})

    const [forceState, forceUpdate] = useForceUpdate();

    const [form] = Form.useForm();
    const material = useMemo(() => {
        if (isMesh(selectObject3D)) {
            return selectObject3D.material
        }
        return null
    }, [selectObject3D])

    const okHandle = (oldValue: string, value: AggregationColor, attributePath: string) => {
        const color = Color3.FromHexString(value.toHexString());
        const material = (selectObject3D as unknown as Mesh)?.material;
        if (viewer && material) {
            viewer?.editor.setMaterialColor3Execute({
                source: "Form",
                object: material,
                attributePath: attributePath,
                oldValue: Color3.FromHexString(oldValue),
                newValue: color,
            })
        }
    }

    const onFieldsChange: FormProps['onFieldsChange'] = (changedFields: FieldData[], allFields: FieldData[]) => {
        const changedField = changedFields[0];
        const name = changedField.name as Array<string>;
        const value = changedField.value === "null" ? null : changedField.value;
        const firstName = name[0] as string;
        console.log(`${name}: ${value}`)

        const material = (selectObject3D as unknown as Mesh)?.material;
        if (selectObject3D && viewer && material) {
            // 如果是名称，只在失去交点时设置
            if (firstName === "name") {
                return
            }

            if (isAggregationColor(value)) {
                let hex = value.toHexString();
                invoke(material, [...name, "fromHexString"], hex)
            } else {
                viewer.editor.setMaterialValueExecute({
                    source: "Form",
                    object: material,
                    attributePath: name,
                    newValue: value,
                })
                // 如果是启用状态，强制更新
                if (name.length === 2 && name.includes("isEnabled")) {
                    forceUpdate()
                }
            }
        }
    }

    const items = useMemo(() => {
        if (material === null) {
            return []
        }

        const list: CollapseProps['items'] = [];
        list.push({
            key: '基础',
            label: '基础',
            children: <Fragment>
                <BoolItem name={["backFaceCulling"]} label="背面剔除"/>
                <SelectItem
                    name={["sideOrientation"]}
                    label="侧边方向"
                    fieldProps={{
                        options: [
                            {label: "无", value: "null"},
                            {label: "顺时针", value: Material.ClockWiseSideOrientation},
                            {label: "逆时针", value: Material.CounterClockWiseSideOrientation},
                        ]
                    }}
                />
                <BoolItem name={["disableLighting"]} label="禁用灯光"/>
                <BoolItem name={["disableColorWrite"]} label="禁用颜色写入"/>
                <BoolItem name={["disableDepthWrite"]} label="禁用深度写入"/>
                <SelectItem
                    name={["depthFunction"]}
                    label="深度函数"
                    fieldProps={{
                        options: [
                            {label: "默认", value: 0},
                            {label: "从不", value: Engine.NEVER},
                            {label: "总是", value: Engine.ALWAYS},
                            {label: "相等", value: Engine.EQUAL},
                            {label: "小于", value: Engine.LESS},
                            {label: "小于或等于", value: Engine.LEQUAL},
                            {label: "大于", value: Engine.GREATER},
                            {label: "大于或等于", value: Engine.GEQUAL},
                            {label: "不相等", value: Engine.NOTEQUAL},
                        ]
                    }}
                />
                <BoolItem name={["needDepthPrePass"]} label="深度预测试"/>
                <BoolItem name={["wireframe"]} label="线框"/>
                <BoolItem name={["pointsCloud"]} label="点云"/>
                <NumberSliderItem name={["pointSize"]} label="点云大小" min={0} max={100} step={0.1}/>
                <NumberSliderItem name={["zOffset"]} label="z偏移" min={-10} max={10} step={0.1}/>
                <NumberSliderItem name={["zOffsetUnits"]} label="z偏移单位" min={-10} max={10} step={0.1}/>
            </Fragment>
        });

        list.push({
            key: '透明',
            label: '透明',
            children: <Fragment>
                <NumberSliderItem name={["alpha"]} label="透明度" min={0} max={1} step={0.1}/>
                <SelectItem
                    name="transparencyMode"
                    label="透明度模式"
                    fieldProps={{
                        options: [
                            {label: "无", value: "null"},
                            {label: "不透明", value: PBRMaterial.PBRMATERIAL_OPAQUE},
                            {label: "测试", value: PBRMaterial.PBRMATERIAL_ALPHATEST},
                            {label: "混合", value: PBRMaterial.PBRMATERIAL_ALPHABLEND},
                            {label: "混合和测试", value: PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND},
                        ]
                    }}
                />
                <SelectItem
                    name={["alphaMode"]}
                    label="混合模式"
                    fieldProps={{
                        options: [
                            {label: "结合", value: Constants.ALPHA_COMBINE},
                            {label: "叠加", value: Constants.ALPHA_ONEONE},
                            {label: "相加", value: Constants.ALPHA_ADD},
                            {label: "相减", value: Constants.ALPHA_SUBTRACT},
                            {label: "相乘", value: Constants.ALPHA_MULTIPLY},
                            {label: "混合", value: Constants.ALPHA_MAXIMIZED},
                            {label: "反混合", value: Constants.ALPHA_PREMULTIPLIED},
                        ]
                    }}
                />
                <BoolItem name={["diffuseTexture", "hasAlpha"]} label="散射贴图是否透明"/>
                {/*todo*/}
                <BoolItem name={["useAlphaFromDiffuseTexture"]} label="使用反射贴图的透明度"/>
                <BoolItem name={["albedoTexture", "hasAlpha"]} label="使用albedo贴图是否透明"/>
                <BoolItem name={["separateCullingPass"]} label="单独的剔除通道"/>
            </Fragment>
        });

        list.push({
            key: '模板',
            label: '模板',
            children: <Fragment>
                <BoolItem name={["stencil"]} label="启用"/>
                <SelectItem name={["mask"]} label="mask"/>
                <BoolItem name={["func"]} label="func" fieldProps={{
                    options: [
                        {label: "Never", value: Constants.NEVER},
                        {label: "Always", value: Constants.ALWAYS},
                        {label: "Equal", value: Constants.EQUAL},
                        {label: "Less", value: Constants.LESS},
                        {label: "Less or equal", value: Constants.LEQUAL},
                        {label: "Greater", value: Constants.GREATER},
                        {label: "Greater or equal", value: Constants.GEQUAL},
                        {label: "Not equal", value: Constants.NOTEQUAL},
                    ]
                }}/>
                <BoolItem name={["funcRef"]} label="funcRef"/>
                <BoolItem name={["funcMask"]} label="funcMask"/>
                <BoolItem name={["funcMask"]} label="funcMask"/>
                <SelectItem name={["opStencilFail"]} label="opStencilFail" fieldProps={{
                    options: [
                        {label: "Keep", value: Constants.KEEP},
                        {label: "Zero", value: Constants.ZERO},
                        {label: "Replace", value: Constants.REPLACE},
                        {label: "Incr", value: Constants.INCR},
                        {label: "Decr", value: Constants.DECR},
                        {label: "Invert", value: Constants.INVERT},
                        {label: "Incr wrap", value: Constants.INCR_WRAP},
                        {label: "Decr wrap", value: Constants.DECR_WRAP},
                    ]
                }}/>
                <SelectItem name={["opDepthFail"]} label="opDepthFail" fieldProps={{
                    options: [
                        {label: "Never", value: Constants.NEVER},
                        {label: "Always", value: Constants.ALWAYS},
                        {label: "Equal", value: Constants.EQUAL},
                        {label: "Less", value: Constants.LESS},
                        {label: "Less or equal", value: Constants.LEQUAL},
                        {label: "Greater", value: Constants.GREATER},
                        {label: "Greater or equal", value: Constants.GEQUAL},
                        {label: "Not equal", value: Constants.NOTEQUAL},
                    ]
                }}/>
                <SelectItem name={["opStencilDepthPass"]} label="opStencilDepthPass" fieldProps={{
                    options: [
                        {label: "Keep", value: Constants.KEEP},
                        {label: "Zero", value: Constants.ZERO},
                        {label: "Replace", value: Constants.REPLACE},
                        {label: "Incr", value: Constants.INCR},
                        {label: "Decr", value: Constants.DECR},
                        {label: "Invert", value: Constants.INVERT},
                        {label: "Incr wrap", value: Constants.INCR_WRAP},
                        {label: "Decr wrap", value: Constants.DECR_WRAP},
                    ]
                }}/>
            </Fragment>
        });

        list.push({
            key: '光照和颜色',
            label: '光照和颜色',
            children: <Fragment>
                <ColorItem name={["albedoColor"]} label="基色" okHandle={okHandle}/>
                <ColorItem name={["reflectivityColor"]} label="反射颜色" okHandle={okHandle}/>
                <NumberSliderItem name={["microSurface"]} label="反射强度" min={0} max={1} step={0.01}/>
                <ColorItem name={["emissiveColor"]} label="自发光颜色" okHandle={okHandle}/>
                <ColorItem name={["ambientColor"]} label="环境光颜色" okHandle={okHandle}/>
                <BoolItem name={["usePhysicalLightFalloff"]} label="物理光照衰减"/>
            </Fragment>
        });

        list.push({
            key: '金属/粗超',
            label: '金属/粗超',
            children: <Fragment>
                <NumberSliderItem name={["metallic"]} label="金属度" min={0} max={1} step={0.01}/>
                <NumberSliderItem name={["roughness"]} label="粗糙度" min={0} max={1} step={0.01}/>
                <NumberSliderItem name={["indexOfRefraction"]} label="折射率" min={0} max={3} step={0.01}/>
                <NumberSliderItem name={["metallicF0Factor"]} label="F0 金属反射率" min={0} max={1} step={0.01}/>
                <ColorItem name={["metallicReflectanceColor"]} label="金属反射颜色"/>
                <BoolItem name={["useOnlyMetallicFromMetallicReflectanceTexture"]} label="仅使用金属反射纹理"/>
                <BabylonTextureItem name={["metallicReflectanceTexture"]} label="金属反射纹理"/>
                <BabylonTextureItem name={["reflectanceTexture"]} label="反射纹理"/>
            </Fragment>
        });

        list.push({
            key: '贴图',
            label: '贴图',
            children: <Fragment>
                <BabylonTextureItem name={["albedoTexture"]} label="基色纹理"/>
                <BabylonTextureItem name={["metallicTexture"]} label="金属度纹理"/>
                <BabylonTextureItem name={["reflectionTexture"]} label="反射纹理"/>
                <BabylonTextureItem name={["refractionTexture"]} label="折射纹理"/>
                <BabylonTextureItem name={["reflectivityTexture"]} label="反射率纹理"/>
                <BabylonTextureItem name={["microSurfaceTexture"]} label="粗糙度纹理"/>
                <BabylonTextureItem name={["bumpTexture"]} label="法线纹理"/>
                <BabylonTextureItem name={["emissiveTexture"]} label="自发光纹理"/>
                <BabylonTextureItem name={["ambientTexture"]} label="环境光纹理"/>

                <BabylonTextureItem name={["diffuseTexture"]} label="光照贴图"/>
                <BabylonTextureItem name={["detailMap", "texture"]} label="细节纹理"/>
                <BoolItem name={["useLightmapAsShadowmap"]} label="光照贴图作为阴影贴图"/>
                <BoolItem name={["detailMap", "isEnabled"]} label="启用细节纹理"/>
                <BoolItem name={["decalMap", "isEnabled"]} label="启用 decal 贴图"/>
            </Fragment>
        });

        list.push({
            key: '透明涂层',
            label: '透明涂层',
            children: <Fragment>
                <BoolItem name={["clearCoat", "isEnabled"]} label="启用"/>
                <NumberSliderItem name={["clearCoat", "intensity"]} label="透明涂层强度"/>
                <NumberSliderItem name={["clearCoat", "roughness"]} label="透明涂层粗糙度"/>
                <NumberSliderItem name={["clearCoat", "indexOfRefraction"]} label="透明涂层折射率"/>
                <NumberSliderItem name={["clearCoat", "remapF0OnInterfaceChange"]}
                                  label="切换界面时重新映射 F0"/>
                <BabylonTextureItem name={["clearCoat", "texture"]} label="透明涂层纹理"/>
                <BabylonTextureItem name={["clearCoat", "textureRoughness"]} label="透明涂层粗糙纹理"/>
                <BabylonTextureItem name={["clearCoat", "bumpTexture"]} label="透明涂层凹凸纹理"/>

                <BoolItem name={["clearCoat", "useRoughnessFromMainTexture"]} label="使用主纹理的粗糙度"/>
                <BoolItem name={["clearCoat", "isTintEnabled"]} label="启用色调贴图"/>
            </Fragment>
        });

        list.push({
            key: '彩虹',
            label: '彩虹',
            children: <Fragment>
                <BoolItem name={["iridescence", "isEnabled"]} label="启用"/>
                <NumberSliderItem name={["iridescence", "intensity"]} label="彩虹色强度"/>
                <NumberSliderItem name={["iridescence", "indexOfRefraction"]} label="折射率"/>
                <NumberSliderItem name={["iridescence", "minimumThickness"]} label="最小厚度"/>
                <NumberSliderItem name={["iridescence", "maximumThickness"]} label="最大厚度"/>
                <BabylonTextureItem name={["iridescence", "texture"]} label="彩虹色纹理"/>
                <BabylonTextureItem name={["iridescence", "thicknessTexture"]} label="厚度纹理"/>
            </Fragment>
        });

        list.push({
            key: '各项异性',
            label: '各项异性',
            children: <Fragment>
                <BoolItem name={["anisotropy", "isEnabled"]} label="启用"/>
                <Fragment>
                    <BoolItem name={["anisotropy", "legacy"]} label="启用传统各向异性"/>
                    <NumberSliderItem name={["anisotropy", "intensity"]} label="各向异性强度"/>
                    <Vector2Item basePropertyName={["anisotropy", "direction"]} label="各向异性方向"/>
                    <BabylonTextureItem name={["anisotropy", "texture"]} label="各向异性纹理"/>
                </Fragment>
            </Fragment>
        });

        list.push({
            key: '光泽',
            label: '光泽',
            children: <Fragment>
                <BoolItem name={["sheen", "isEnabled"]} label="启用"/>
                <BoolItem name={["sheen", "linkSheenWithAlbedo"]} label="将 Sheen 与基色链接"/>
                <NumberSliderItem name={["sheen", "intensity"]} label="Sheen 强度"/>
                <ColorItem name={["sheen", "color"]} label="Sheen 颜色"/>
                <BabylonTextureItem name={["sheen", "texture"]} label="Sheen 纹理"/>
                <BabylonTextureItem name={["sheen", "textureRoughness"]} label="粗糙度纹理"/>
                <BoolItem name={["sheen", "textureRoughness"]} label="使用粗糙度纹理"/>
                <BoolItem name={["sheen", "_useRoughness"]} label="启用粗糙度"/>
            </Fragment>
        });

        list.push({
            key: '强度',
            label: '强度',
            children: <Fragment>
                <NumberSliderItem name={["environmentIntensity"]} label="环境强度" min={0} max={1} step={0.01}/>
                <NumberSliderItem name={["specularIntensity"]} label="高光强度" min={0} max={1} step={0.01}/>
                <NumberSliderItem name={["emissiveIntensity"]} label="自发光强度" min={0} max={3} step={0.01}/>
                <NumberSliderItem name={["directIntensity"]} label="直接光强度" min={0} max={1} step={0.01}/>
            </Fragment>
        });

        list.push({
            key: '渲染',
            label: '渲染',
            children: <Fragment>
                <BoolItem name={["useAlphaFromAlbedoTexture"]} label="使用颜色纹理的 Alpha 通道"/>
                <BoolItem name={["useAmbientInGrayScale"]} label="使用灰度环境光"/>
                <BoolItem name={["useRadianceOverAlpha"]} label="自发光使用 Alpha 通道"/>
                <BoolItem name={["useMicroSurfaceFromReflectivityMapAlpha"]} label="反射图 Alpha 通道作为微表面"/>
                <BoolItem name={["useSpecularOverAlpha"]} label="高光使用 Alpha 通道"/>
                <BoolItem name={["enableSpecularAntiAliasing"]} label="启用高光抗锯齿"/>
                <BoolItem name={["realTimeFiltering"]} label="实时过滤"/>
                <SelectItem
                    name={["realTimeFilteringQuality"]}
                    label="实时过滤质量"
                    fieldProps={{
                        options: [
                            {label: "低", value: Constants.TEXTURE_FILTERING_QUALITY_LOW},
                            {label: "中", value: Constants.TEXTURE_FILTERING_QUALITY_MEDIUM},
                            {label: "高", value: Constants.TEXTURE_FILTERING_QUALITY_HIGH},
                        ]
                    }}
                />
            </Fragment>
        });

        return list
    }, [selectObject3D, forceState])

    const [initName, setInitName] = useState<string>('')

    const RenderMaterialList = () => {
        if (selectObject3D) {
            if (material) {
                return <Form
                    form={form}
                    onFieldsChange={onFieldsChange}
                    name="MaterialAttribute"
                    labelAlign="right"
                    labelWrap={true}
                    labelCol={{span: 8}}
                    wrapperCol={{span: 16}}>
                    <ObjectAttributeProvider
                        value={{object: material, change: viewer?.editor.editorEventManager.selectMaterialChanged}}>
                        <TextItem name={["id"]} label={["id"]}/>
                        <TextItem name={["uniqueId"]} label={["唯一标识"]}/>
                        <TextItem label="类型" virtual valueSource={"fun"} funName={"getClassName"}/>
                        <InputItem name={["name"]} label="名称"
                                   fieldProps={{
                                       onFocus: () => {
                                           setInitName(get(selectObject3D, "name"))
                                       },
                                       onBlur: (e) => {
                                           viewer?.editor.setObjectValueExecute({
                                               source: "Form",
                                               object: selectObject3D,
                                               attributePath: ["name"],
                                               oldValue: initName,
                                               newValue: e.target.value,
                                           })
                                           viewer?.editor.editorEventManager.sceneGraphChanged.next(true)
                                       }
                                   }}
                        />
                        <Collapse items={items} bordered={false} ghost defaultActiveKey={['贴图']}/>
                    </ObjectAttributeProvider>
                </Form>
            }
            return <EmptyState text="当前对象没有材质"/>
        } else {
            return <EmptyState text="未选择对象"/>
        }
    }

    return (
        <Fragment>
            <RenderMaterialList/>
        </Fragment>
    )
}

