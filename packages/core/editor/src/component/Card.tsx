import {DesktopOutlined, EllipsisOutlined, FolderOutlined, FormOutlined} from "@ant-design/icons";
import {Button, Dropdown, MenuProps, Tooltip} from "antd";
import dayjs from "dayjs";
import {useMemo} from "react";

import {useNavigate} from "react-router-dom";
import {EAppType} from "../interface/IApplication.ts";

export interface CardProps {
    item: IApplication;
    reset: () => void;
}

export function Card(props: CardProps) {
    const {item, reset} = props
    console.log(item)
    const {name, appType, createTime} = item;

    const remove = async () => {
        console.log("删除")
        const res = await ApplicationApi.remove(item.id);
        if (res.code === 1) {
            reset()
        }
    }

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: (
                <div onClick={remove}>
                    删除
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <div>
                    移动
                </div>
            ),
        },
    ];
    const isDir = useMemo(() => {
        return appType === EAppType.DIR;
    }, [appType]);
    const navigate = useNavigate();
    const skip = () => {
        console.log("skip")
        // window.open(`/babylon-edit/${item.id}`, '_blank');

        navigate(`/babylon-edit/${item.id}`); // 跳转到指定路由

    }

    const formatTime = (time: Date) => {
        return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
    }

    return (
        <div className="rounded-xl border shadow space-y-2 overflow-hidden h-[200px]">
            <div className="h-[60%] border-b">
                {
                    isDir ?
                        <div className="flex justify-center items-center h-full">
                            <FolderOutlined className="text-9xl"/>
                        </div>
                        : <img onClick={skip} className="w-full h-full object-cover cursor-pointer" src="test.png"
                               alt="图片"/>
                }
            </div>
            <div className="h-[40%] p-2">
                <div className="">
                    {name}
                </div>
                <div className="flex justify-between items-center mb-4">
                    <div className="text-xs">
                        {formatTime(createTime)}
                    </div>
                    <div className="space-x-1">
                        <Tooltip title="编辑">
                            <Button size={"small"} color="default" variant="filled" icon={<FormOutlined/>}
                                    onClick={skip}/>
                        </Tooltip>
                        <Tooltip title="预览">
                            <Button size={"small"} color="default" variant="filled" icon={<DesktopOutlined/>}/>
                        </Tooltip>
                        <Dropdown key="Dropdown" menu={{items}}>
                            <Button size={"small"} color="default" variant="filled" icon={<EllipsisOutlined/>}/>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </div>
    );
}