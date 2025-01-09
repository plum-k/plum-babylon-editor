import {Fragment, useEffect, useMemo, useState} from "react";
import {useViewer} from "../store";
import {SceneStatistics} from "@plum-render/babylon-sdk";
import {Collapse, CollapseProps, Form} from "antd";
import {ObjectAttributeProvider, TextItem} from "@plum-render/common-ui";

export default function StatisticsData() {
    const viewer = useViewer()
    const [form] = Form.useForm();

    let timerIntervalId: number = 0;
    const [info, setInfo] = useState<SceneStatistics>({
        absoluteFPS: 0,
        activeBones: 0,
        activeFaces: 0,
        activeIndices: 0,
        activeMeshes: 0,
        activeParticles: 0,
        animationsTime: 0,
        compressedTextures: false,
        drawBuffersExtension: false,
        drawCalls: 0,
        driverInfo: "",
        engineDescription: "",
        fragmentDepthSupported: false,
        frameTotalTime: 0,
        gpuFrameTime: 0,
        gpuFrameTimeAverage: 0,
        hardwareInstances: false,
        hardwareScalingLevel: 0,
        highPrecisionShaderSupported: false,
        interFrameTime: 0,
        maxAnisotropy: 0,
        maxTextureSize: 0,
        maxTexturesImageUnits: 0,
        meshesSelectionTime: 0,
        parallelShaderCompile: false,
        particlesTime: 0,
        physicsTime: 0,
        renderTargetsTime: 0,
        renderTime: 0,
        renderToTextureFloat: false,
        renderToTextureHalfFloat: false,
        resolution: "",
        spritesTime: 0,
        stdDerivatives: false,
        stencilEnable: false,
        textureFloat: false,
        textureHalfFloat: false,
        timerQuery: false,
        totalLights: 0,
        totalMaterials: 0,
        totalMeshes: 0,
        totalTextures: 0,
        totalVertices: 0,
        uintIndices: false,
        vertexArrayObject: false
    })

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
            setInfo(_info)
        }
    }

    const items = useMemo(() => {
        const list: CollapseProps['items'] = [];
        list.push({
            key: '数量统计',
            label: '数量统计',
            children: <Fragment>
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
            </Fragment>
        });

        list.push({
            key: '帧率统计',
            label: '帧率统计',
            children: <Fragment>
                <TextItem name="absoluteFPS" label="绝对 FPS" decimalSeparator={1}/>
                <TextItem name="meshesSelectionTime" label="网格选择时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="renderTargetsTime" label="渲染目标时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="particlesTime" label="粒子时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="spritesTime" label="精灵时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="animationsTime" label="动画时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="physicsTime" label="物理时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="renderTime" label="渲染时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="frameTotalTime" label="帧总时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="interFrameTime" label="帧间时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="gpuFrameTime" label="GPU 帧时间" decimalSeparator={2} suffix={" ms"}/>
                <TextItem name="gpuFrameTimeAverage" label="GPU 帧时间 (平均)" decimalSeparator={2} suffix={" ms"}/>
            </Fragment>
        });

        list.push({
            key: '系统信息',
            label: '系统信息',
            children: <Fragment>
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
            </Fragment>
        });
        return list
    }, [info])
    // <TextLineComponent label="Version" value={Engine.Version} color="rgb(113, 159, 255)" />
    // <ValueLineComponent label="FPS" value={engine.getFps()} fractionDigits={0} />
    return (
        <Fragment>
            <Form
                form={form}
                name="StatisticsData"
                labelAlign="right"
                labelWrap={true}
                labelCol={{span: 10}}
                wrapperCol={{span: 14}}
            >
                <ObjectAttributeProvider value={{object: info}}>
                    <Collapse items={items} bordered={false} ghost
                              defaultActiveKey={['数量统计', "帧率统计", "系统信息"]}/>
                </ObjectAttributeProvider>
            </Form>
        </Fragment>
    )
}

