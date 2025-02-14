import {Breadcrumb, Button, Flex, Form, Input, Modal} from "antd";
import {FileFilled, FolderAddOutlined, FolderFilled, HomeOutlined, RedoOutlined} from "@ant-design/icons";
import {useViewer} from "../../../../store";
import {CSSProperties, FC, Fragment, PropsWithChildren, useEffect, useMemo, useState} from "react";
import {EFolder, IFileInfo} from "../../../../interface";
import {useToken} from "../../../../hooks";
import {ListObjectResult} from "ali-oss";
import {BreadcrumbItemType} from "antd/es/breadcrumb/Breadcrumb";
import {findIndex} from "lodash-es";

// oss 数据整理
function getInfo(basePath: string, res: ListObjectResult) {
    let mergedArray: IFileInfo[] = []
    res.prefixes?.forEach(prefix => {
        mergedArray.push({
            name: prefix.replace(basePath, ''), type: EFolder.FOLDER, rawName: prefix,
            parent: basePath,
        });
    });
    res.objects
        .filter(object => !object.name.endsWith('/')) // 只保留文件
        .forEach(object => {
            mergedArray.push({
                ...object, name: object.name.replace(basePath, ''),
                type: EFolder.FILE,
                parent: "",
                rawName: object.name
            });
        });
    return mergedArray;
}

interface CubeFlexProps extends PropsWithChildren {
    style?: CSSProperties
}

const CubeFlex: FC<CubeFlexProps> = (props) => {
    return (
        <Flex justify={"center"} align={"center"}
              style={{
                  width: "25px", height: "25px",
                  ...props.style
              }}
        >
            {props.children}
        </Flex>
    )
}

export function ModelAsset() {
    const viewer = useViewer()
    const token = useToken()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [folders, setFolders] = useState<IFileInfo[]>([]);
    const [fileInfo, setFileInfo] = useState<IFileInfo>({
        rawName: "models/"
    } as IFileInfo);
    const [dirList, setDirList] = useState<IFileInfo[]>([]);

    const showModal = () => {
        setIsModalOpen(true);
    };
    const getFolder = (info: IFileInfo = fileInfo) => {
        if (!viewer) return;
        const oss = viewer!.ossApi!;
        const {rawName} = info;
        console.log("请求 path", rawName);
        oss.list(rawName, "/").then((res) => {
            const info = getInfo(rawName, res)
            console.log(res)
            console.log(info)
            setFolders(info)
        })
    }
    useEffect(() => {
        getFolder(fileInfo);
    }, []);

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // ------------------------- 工具栏点击事件-------------------

    const handleOk = () => {
        const value = form.getFieldsValue();
        console.log(value)
        let newName = value.name;
        const ossApi = viewer!.ossApi!;
        let {name} = path;
        name = `${name}/newName`

        ossApi.mkdir(name).then(() => {
            getFolder();
            setIsModalOpen(false);
        })
    };

    //---------------------拖拽文件到画布----------------------
    const handlerDragstart = (e: DragEvent, item: IFileInfo) => {
        e.dataTransfer!.setData("data", JSON.stringify({...item, type: "model"}))
    }
    const handleDir = (item: IFileInfo) => {
        setFileInfo(item);
        console.log("item", item)
        setDirList([...dirList, item]);
        getFolder(item);
    }
    const items = useMemo<BreadcrumbItemType[]>(() => {
        const list = [{
            title:
                <HomeOutlined onClick={() => {
                    setFileInfo({
                        rawName: "models/"
                    } as IFileInfo);
                    getFolder({
                        rawName: "models/"
                    } as IFileInfo)
                    setDirList([]);
                }}/>
        }]
        console.log("dirList", dirList)
        for (let i = 0, len = dirList.length; i < len; i++) {
            const dir = dirList[i]
            console.log(dir.name.slice(0, -1))
            const name = dir.name.slice(0, -1)
            list.push({
                title:
                    <div className="cursor-pointer hover:text-[#69b1ff]" onClick={() => {
                        setFileInfo(dir as IFileInfo);
                        getFolder(dir as IFileInfo)
                        const index = findIndex(dirList, {name: dir.name});
                        const newList = dirList.slice(0, index + 1);
                        setDirList(newList);
                    }}>
                        {name}
                    </div>
            })
        }
        return list
    }, [dirList])
    return (
        <Fragment>
            <Modal
                title="新建文件夹"
                okText={"确认"}
                cancelText={"取消"}
                open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <Form
                    form={form}
                >
                    <Form.Item
                        label="文件夹名称"
                        name="name"
                    >
                        <Input/>
                    </Form.Item>
                </Form>
            </Modal>
            <Flex>
                <CubeFlex>
                    <FolderAddOutlined onClick={showModal}/>
                </CubeFlex>
                <CubeFlex>
                    <RedoOutlined onClick={() => getFolder(fileInfo)}/>
                </CubeFlex>
                <div
                    style={{width: "100%"}}
                    className={"flex items-center h-[25px] ml-[4px]"}
                >
                    <Breadcrumb items={items}/>
                </div>
            </Flex>
            <div style={{
                backgroundColor: token.colorBgContainer,
                color: token.colorTextBase,
            }}
                 className={"w-full h-full p-[10px]"}>

                <div className="overflow-auto h-full mt-[5px]">
                    <div className="flex gap-2 flex-wrap">
                        {folders.map((item, index) => {
                            const isFolder = item.type === EFolder.FOLDER;
                            if (isFolder) {
                                return <div
                                    style={{
                                        background: token.colorBgLayout,
                                        borderRadius: token.borderRadiusLG,
                                    }}
                                    key={index} onClick={() => handleDir(item)}
                                    className="w-[80px] h-[80px] text-center">
                                    <div className="folder-icon text-[2em] mt-[10px]">
                                        <FolderFilled/>
                                    </div>
                                    <div className="mt-[5px] text-[1em]">{item.name}</div>
                                </div>
                            }
                            return <div
                                style={{
                                    background: token.colorBgLayout,
                                    borderRadius: token.borderRadiusLG,
                                }}
                                key={index} onClick={() => handleDir(item)}
                                onDragStart={(e) => handlerDragstart(e, item)}
                                className="w-[80px] h-[80px] text-center cursor-pointer" draggable={true}>
                                <div className="folder-icon text-[2em] mt-[10px]">
                                    <FileFilled/>
                                </div>
                                <div className="mt-[5px] text-[1em]">{item.name}</div>
                            </div>
                        })}
                    </div>
                </div>
            </div>
        </Fragment>
    )
}