import {IDragInfo} from "../../../interface/IDragInfo.ts";

export interface IDragCardProps  extends IDragInfo{
}

export function DragCard(props: IDragCardProps) {
    const {name,label} = props;

    const onDragStart = (event: any) => {
        event.dataTransfer.setData('data', JSON.stringify(props))
    }

    return (
        <div
            className={"cursor-pointer"}
            draggable={true} onDragStart={onDragStart}>
            {label}
        </div>
    )
}