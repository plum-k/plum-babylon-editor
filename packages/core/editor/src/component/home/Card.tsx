import {AppstoreOutlined, DesktopOutlined, EllipsisOutlined, FolderOutlined, FormOutlined} from "@ant-design/icons";
import {Button, Dropdown, MenuProps, Tooltip} from "antd";
import dayjs from "dayjs";
import {useMemo} from "react";
import {EAppType, IApplication} from "../../interface";
import {ApplicationApi} from "../../api";
import {useLocation} from "react-router";

export interface CardProps {
    item: IApplication;
    handleDir: (item: IApplication) => void;
    handleEdit: (item: IApplication) => void;
    reset: () => void;
}

export function Card(props: CardProps) {
    const {item, reset, handleDir, handleEdit} = props
    const {name, appType, createTime} = item;
    const location = useLocation();
    console.log(location);
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
    ];
    const isDir = useMemo(() => {
        return appType === EAppType.DIR;
    }, [appType]);
    const skip = () => {
        if (isDir) {
            handleDir(item)
        } else {
            const url = `${window.location.origin}/#/editor/${item.id}`
            window.open(url, '_blank');
        }
    }
    const preview = () => {
        const url = `${window.location.origin}/#/preview/${item.id}`
        window.open(url, '_blank');
    }
    const formatTime = (time: Date) => {
        return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
    }

    const edit = () => {
        handleEdit(item);
    }

    const RenderCardImg = () => {
        if (isDir) {
            return <div className="flex justify-center items-center h-full">
                <FolderOutlined className="text-9xl"/>
            </div>
        }
        if (item.thumbnailBase64) {
            return <img onClick={skip} className="w-full h-full object-cover cursor-pointer" src={item.thumbnailBase64}
                        alt="图片"/>
        } else {
            return <div className="flex justify-center items-center h-full">
                <AppstoreOutlined className="text-9xl"/>
            </div>
        }
    }

    return (
        <div className="rounded-xl border shadow space-y-2 overflow-hidden h-[200px]">
            <div className="h-[60%] border-b cursor-pointer" onClick={skip}>
                <RenderCardImg/>
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
                                    onClick={edit}/>
                        </Tooltip>
                        <Tooltip title="预览">
                            <Button size={"small"} color="default" variant="filled" icon={<DesktopOutlined/>}
                                    onClick={preview}/>
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