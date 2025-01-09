import {Empty} from "antd";

export interface IEmptyStateProps {
    /**
     * 文本
     */
    text?: string
}

/**
 * 空状态
 * @param props
 * @constructor
 */
export default function EmptyState(props: IEmptyStateProps) {
    return (
        <div className="flex justify-center items-center h-full">
            <Empty description={false}>
                {props.text}
            </Empty>
        </div>
    )
}


