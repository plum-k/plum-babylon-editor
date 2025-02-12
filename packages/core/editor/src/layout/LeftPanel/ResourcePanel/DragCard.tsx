import {IDragInfo} from "../../../interface/IDragInfo.ts";
import {Icon} from "../../../component";
import {Flex} from "antd";

export interface IDragCardProps extends IDragInfo {
}

export function DragCard(props: IDragCardProps) {
    const {name, icon, label} = props;

    const onDragStart = (event: any) => {
        event.dataTransfer.setData('data', JSON.stringify(props))
    }

    return (
        <Flex
            vertical={true}
            justify="center"
            align="center"
            className={"cursor-pointer w-15 bg-gray-100 rounded-lg hover:translate-y-1 hover:shadow-1xl"}
            draggable={true} onDragStart={onDragStart}>
            <Icon iconName={icon} className={"mt-3 ml-auto mr-auto"}/>
            <div className={"mt-2 ml-auto mr-auto"}>{label}</div>
        </Flex>
    )
}