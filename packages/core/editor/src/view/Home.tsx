import AddAppModalForm from "../component/Home/AddAppModalForm.tsx";
import {PropsWithChildren, useEffect, useMemo, useState} from "react";
import {Card} from "../component";
import {IApplication} from "../interface";
import {ApplicationApi} from "../api";
import {Breadcrumb, Button, Flex} from "antd";
import {BreadcrumbItemType} from "antd/es/breadcrumb/Breadcrumb";
import {HomeOutlined} from "@ant-design/icons";
import EditAppModalForm from "../component/Home/EditAppModalForm.tsx";
import {findIndex} from "lodash-es";

export default function Home() {
    const [folders, setFolders] = useState<IApplication[]>([]);
    const [appInfo, setAppInfo] = useState<null | IApplication>(null);
    const [editAppInfo, setEditAppInfo] = useState<null | IApplication>(null);
    const [dirList, setDirList] = useState<IApplication[]>([]);
    const [open, setOpen] = useState(false);

    const getFolders = (appInfo: null | IApplication) => {
        ApplicationApi.getAll(appInfo?.id).then(res => {
            if (res.code === 1) {
                setFolders(res.data);
            }
        })
    }

    const BreadcrumbItem = (props: PropsWithChildren) => {
        return (
            <div className={"breadcrumb-item cursor-pointer"}>
                {props.children}
            </div>
        )
    }
    const handleDir = (item: IApplication) => {
        setAppInfo(item);
        getFolders(item);
        setDirList([...dirList, item]);
    }

    const handleEdit = (item: IApplication) => {
        setEditAppInfo(item);
        setOpen(true);
    }
    const items = useMemo<BreadcrumbItemType[]>(() => {
        const list = [{
            title: <BreadcrumbItem>
                <HomeOutlined onClick={() => {
                    setAppInfo(null);
                    getFolders(null)
                    setDirList([]);
                }}/>
            </BreadcrumbItem>,
        }]
        for (let i = 0, len = dirList.length; i < len; i++) {
            const dir = dirList[i]
            list.push({
                title: <BreadcrumbItem>
                    <div onClick={() => {
                        setAppInfo(dir);
                        getFolders(dir)
                        const index = findIndex(dirList, {id: dir.id});
                        const newList = dirList.slice(0, index + 1);
                        setDirList(newList);
                    }}>
                        {dir.name}
                    </div>
                </BreadcrumbItem>,
            })
        }
        return list
    }, [dirList])


    useEffect(() => {
        getFolders(null)
    }, []);
    const reset = () => {
        getFolders(appInfo)
    }

    const example = () => {
        window.open(import.meta.env.VITE_EXAMPLE, '_blank');
    }
    const doc = () => {
        window.open(import.meta.env.VITE_DOC, '_blank');
    }

    return (
        <div className="bg-black/80 w-screen h-screen">
            <div
                className="bg-white w-3/5 h-3/5 top-0 left-0 bottom-0 right-0 m-auto fixed  border rounded-[0.5rem] shadow flex flex-col">
                <div className="border-b p-2">
                    <Flex align={"center"}>
                        <AddAppModalForm appInfo={appInfo} ok={reset}/>
                        <EditAppModalForm open={open} setOpen={setOpen} editAppInfo={editAppInfo} ok={reset}/>
                        <div className="ml-3">
                            <Breadcrumb items={items}/>
                        </div>
                        <div className="grow"></div>
                        <Button color="default" variant="link" onClick={example}>
                            示例
                        </Button>
                        <Button color="default" variant="link" onClick={doc}>
                            文档
                        </Button>
                    </Flex>
                </div>
                <div className="p-4 overflow-hidden">
                    <div className="grid gap-4 grid-cols-4 overflow-auto h-full w-full">
                        {
                            folders.map((item, index) => {
                                return <Card handleDir={handleDir} reset={reset} handleEdit={handleEdit} item={item}
                                             key={index}/>
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

