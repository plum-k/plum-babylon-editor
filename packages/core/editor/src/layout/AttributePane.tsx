import {Fragment} from "react";
import {Tabs, Tooltip} from "antd";
import {
    ApartmentOutlined,
    AreaChartOutlined,
    BgColorsOutlined,
    ExperimentOutlined,
    FileTextOutlined,
    RocketOutlined,
    SlidersOutlined
} from "@ant-design/icons";
import {
    ConfigAttribute,
    MaterialAttribute,
    NodeAttribute,
    PhysicsAttribute,
    PostProcessAttribute,
    SceneAttribute,
    StatisticsData
} from "../component";

export  function AttributePane() {
    const items = [
        {
            label: (
                <Tooltip title="属性" placement={"left"}>
                    <FileTextOutlined/>
                </Tooltip>
            ),
            key: "NodeAttribute",
            children: <NodeAttribute/>,
        },
        {
            label: (
                <Tooltip title="材质" placement={"left"}>
                    <BgColorsOutlined/>
                </Tooltip>
            ),
            key: "MaterialAttribute",
            children: <MaterialAttribute/>,
        },
        {
            label: (
                <Tooltip title="物理" placement={"left"}>
                    <RocketOutlined/>
                </Tooltip>
            ),
            key: "PhysicsAttribute",
            children: <PhysicsAttribute/>,
        },
        {
            label: (
                <Tooltip title="后处理" placement={"left"}>
                    <ExperimentOutlined/>
                </Tooltip>
            ),
            key: "PostProcessAttribute",
            children: <PostProcessAttribute/>,
        },
        {
            label: (
                <Tooltip title="场景" placement={"left"}>
                    <ApartmentOutlined/>
                </Tooltip>
            ),
            key: "SceneAttribute",
            children: <SceneAttribute/>,
        },
        {
            label: (
                <Tooltip title="统计" placement={"left"}>
                    <AreaChartOutlined/>
                </Tooltip>
            ),
            key: "StatisticsData",
            children: <StatisticsData/>,
        },
        {
            label: (
                <Tooltip title="配置" placement={"left"}>
                    <SlidersOutlined/>
                </Tooltip>
            ),
            key: "ConfigAttribute",
            children: <ConfigAttribute/>,
        },
    ]

    return (
        <Fragment>
            <Tabs
                className={"plum-tabs"}
                defaultActiveKey="NodeAttribute"
                // defaultActiveKey="MaterialAttribute"
                size={"large"}
                tabPosition={"left"}
                items={items}
                // activeKey={"NodeAttribute"}
            />
        </Fragment>
    )
}

