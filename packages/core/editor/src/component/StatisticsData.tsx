import {FC, Fragment, useEffect, useState} from "react";
import {useViewer} from "../store";
import {SceneStatistics} from "@plum-render/babylon-sdk";
import {Form} from "antd";
import {ObjectAttributeProvider, TextItem} from "@plum-render/common-ui";

const StatisticsData: FC = () => {
    const viewer = useViewer()
    let timerIntervalId: number = 0;
    const [info, setInfo] = useState<SceneStatistics>({})

    useEffect(() => {
        if (viewer) {
            timerIntervalId = window.setInterval(() => {
                update()
            }, 500);
        }
        return () => {
            if (timerIntervalId) {
                window.clearInterval(timerIntervalId);
            }
        }
    }, [viewer])


    const update = () => {
        if (viewer) {
            viewer.statistics.init()
            viewer.statistics.update();
            let _info = viewer.statistics.getInfo();
            // console.log(_info)
            setInfo(_info)
        }
    }
    const [form] = Form.useForm();
    // <TextLineComponent label="Version" value={Engine.Version} color="rgb(113, 159, 255)" />
    // <ValueLineComponent label="FPS" value={engine.getFps()} fractionDigits={0} />
    return (
        <Fragment>
            <div>
                <Form
                    form={form}
                    name="StatisticsData"
                    labelAlign="right"
                    labelCol={{span: 6}}
                >
                    <ObjectAttributeProvider value={{object: info}}>
                        <TextItem name="totalMeshes" label="总网格数量"/>
                        <TextItem name="activeMeshes" label="活动网格数量"/>
                        <TextItem name="activeIndices" label="活动索引数量"/>
                        <TextItem name="activeFaces" label="活动面数量"/>
                        <TextItem name="activeBones" label="活动骨骼数量"/>
                        <TextItem name="activeParticles" label="活动粒子数量"/>
                        <TextItem name="drawCalls" label="绘制调用次数"/>
                        <TextItem name="totalLights" label="总灯光数量"/>
                        <TextItem name="totalVertices" label="总顶点数量"/>
                        <TextItem name="totalMaterials" label="总材质数量"/>
                        <TextItem name="totalTextures" label="总纹理数量"/>

                        <TextItem name="absoluteFPS" label="绝对 FPS"/>
                        <TextItem name="meshesSelectionTime" label="网格选择时间"/>
                        <TextItem name="renderTargetsTime" label="渲染目标时间"/>
                        <TextItem name="particlesTime" label="粒子时间"/>
                        <TextItem name="spritesTime" label="精灵时间"/>
                        <TextItem name="animationsTime" label="动画时间"/>
                        <TextItem name="physicsTime" label="物理时间"/>
                        <TextItem name="renderTime" label="渲染时间"/>
                        <TextItem name="frameTotalTime" label="帧总时间"/>
                        <TextItem name="interFrameTime" label="帧间时间"/>
                        <TextItem name="gpuFrameTime" label="GPU 帧时间"/>
                        <TextItem name="gpuFrameTimeAverage" label="GPU 帧时间 (平均)"/>

                        <TextItem name="resolution" label="分辨率"/>
                        <TextItem name="hardwareScalingLevel" label="硬件缩放级别"/>
                        <TextItem name="engineDescription" label="引擎描述"/>
                        <TextItem name="stdDerivatives" label="标准导数"/>
                        <TextItem name="compressedTextures" label="压缩纹理"/>
                        <TextItem name="hardwareInstances" label="硬件实例"/>
                        <TextItem name="textureFloat" label="纹理浮点"/>
                        <TextItem name="textureHalfFloat" label="纹理半浮点"/>
                        <TextItem name="renderToTextureFloat" label="渲染到纹理浮点"/>
                        <TextItem name="renderToTextureHalfFloat" label="渲染到纹理半浮点"/>
                        <TextItem name="uintIndices" label="32 位索引"/>
                        <TextItem name="fragmentDepthSupported" label="片段深度"/>
                        <TextItem name="highPrecisionShaderSupported" label="高精度着色器"/>
                        <TextItem name="drawBuffersExtension" label="绘制缓冲区扩展"/>
                        <TextItem name="vertexArrayObject" label="顶点数组对象"/>
                        <TextItem name="timerQuery" label="定时器查询"/>
                        <TextItem name="stencilEnable" label="模板"/>
                        <TextItem name="parallelShaderCompile" label="并行着色器编译"/>
                        <TextItem name="maxTexturesImageUnits" label="最大纹理单元"/>
                        <TextItem name="maxTextureSize" label="最大纹理尺寸"/>
                        <TextItem name="maxAnisotropy" label="最大各向异性"/>
                        <TextItem name="driverInfo" label="驱动信息"/>
                    </ObjectAttributeProvider>
                </Form>
            </div>
        </Fragment>
    )
}

export default StatisticsData;
