import {Fragment} from "react";
import {Tabs, Tooltip} from "antd";
import NodeAttribute from "../component/attributePane/NodeAttribute/NodeAttribute.tsx";
import MaterialAttribute from "../component/attributePane/MaterialAttribute.tsx";
import SceneAttribute from "../component/attributePane/SceneAttribute.tsx";
import PostProcessAttribute from "../component/attributePane/PostProcessAttribute.tsx";
import StatisticsData from "../component/StatisticsData.tsx";
import ConfigAttribute from "../component/attributePane/ConfigAttribute.tsx";
import {
    ApartmentOutlined,
    AreaChartOutlined,
    BgColorsOutlined,
    ExperimentOutlined,
    FileTextOutlined,
    SlidersOutlined
} from "@ant-design/icons";

export default function AttributePane() {
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
                <Tooltip title="场景" placement={"left"}>
                    <ApartmentOutlined/>
                </Tooltip>
            ),
            key: "SceneAttribute",
            children: <SceneAttribute/>,
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

