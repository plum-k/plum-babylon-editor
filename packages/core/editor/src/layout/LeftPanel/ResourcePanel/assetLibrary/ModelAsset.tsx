import {Flex, Form, Input, Modal} from "antd";
import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    FileFilled,
    FolderAddOutlined,
    FolderFilled,
    RedoOutlined,
    VerticalAlignTopOutlined
} from "@ant-design/icons";
import {useViewer} from "../../../../store";
import {CSSProperties, FC, PropsWithChildren, useEffect, useMemo, useState} from "react";
import {EFolder, IFileInfo} from "../../../../interface";
import {useToken} from "../../../../hooks";

function countOccurrences(str: string, subStr: string) {
    if (subStr === "") return str.length + 1;
    let count = 0;
    let pos = str.indexOf(subStr);

    while (pos !== -1) {
        count++;
        pos = str.indexOf(subStr, pos + subStr.length);
    }

    return count;
}


const SearchBar = () => (
    <div className="search-bar">
        <input type="text" placeholder="搜索"/>
    </div>
);

// oss 数据整理
function getInfo(basePath: string, res: any) {
    let mergedArray = []
    res.prefixes.forEach(prefix => {
        mergedArray.push({name: prefix.replace(basePath, ''), type: EFolder.FOLDER});
    });
    res.objects
        .filter(object => !object.name.endsWith('/')) // 只保留文件
        .forEach(object => {
            mergedArray.push({
                ...object, name: object.name.replace(basePath, ''),
                type: EFolder.FILE,
                rawName: object.name,
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
    const showModal = () => {
        setIsModalOpen(true);
    };
    const getFolder = () => {
        if (!viewer) return;
        const oss = viewer!.ossApi!;
        oss.list(path, "/").then((res) => {
            console.log(res)
            const info = getInfo(path, res)
            console.log(info)
            setFolders(info)
        })
    }
    const [folders, setFolders] = useState<Array<IFileInfo>>([]);
    const [path, setPath] = useState<string>("models/");
    const [history, setHistory] = useState<Array<string>>(["/"]);
    const [currentNum, setCurrentNum] = useState<number>(0);
    useEffect(() => {
        getFolder();
    }, []);
    const handleOk = () => {
        const value = form.getFieldsValue();
        console.log(value)
        let name = value.name;

        if (path === "/") {
            name = `${name}/`
        } else {
            name = `${path}/${name}`
        }
        COSApi.uploadFile({
            Body: "",
            Key: name
        }).then(() => {
            getFolder();
            setIsModalOpen(false);
        })
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const isLeftClick = useMemo(
        () => {
            return currentNum !== 0;
        },
        [currentNum]
    );
    const isRightClick = useMemo(
        () => {
            return currentNum !== history.length - 1;
        },
        [currentNum, history]
    );
    const isParentClick = useMemo(
        () => {
            return path !== "/";
        },
        [path]
    );
    const handlerDragstart = (e: DragEvent, item: IFileInfo) => {
        e.dataTransfer!.setData("data", JSON.stringify({...item, type: "model"}))
    }
    const selectPath = (item: IFileInfo) => {
        // item.name;
        // setPath(path)
        if (item.type === EFolder.FOLDER) {
            setCurrentNum(history.length + 1)
            setHistory([...history, item.name])
            setPath(item.name);
        } else {

        }
    }
    const leftClick = () => {
        const length = history.length;
        const _currentNum = currentNum - 1;
        // debugger
        if (length > 0 && isLeftClick) {
            setPath(history[_currentNum]);
            setCurrentNum(_currentNum);
            // setHistory(history.slice(0, -1));
        }
    }

    const rightClick = () => {
        const length = history.length;
        if (length > 0 && isRightClick) {
            const _currentNum = currentNum + 1;
            setPath(history[_currentNum]);
            setCurrentNum(_currentNum);
            // setPath(history[length - 1]);
            // setHistory(history.slice(0, -1));
        }
    }
    const parentClick = () => {
        const count = countOccurrences(path, "/")
        if (count === 1) {
            let node: IFileInfo = {
                type: EFolder.FOLDER,
                name: "/"
            }
            selectPath(node)
        } else {

        }
    }

    return (
        <div>
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
            <div style={{
                // backgroundColor: token.colorBgBase,
                backgroundColor: token.colorBgContainer,
                color: token.colorTextBase,
                padding: '10px',
                height: '100%',
                width: '100%'
            }}>
                <Flex gap={2}>
                    <CubeFlex
                        style={{
                            // background: isLeftClick ? "" : token.colorBgContainerDisabled,
                            color: isLeftClick ? "" : token.colorTextDisabled
                        }}
                    >
                        <ArrowLeftOutlined onClick={leftClick}/>
                    </CubeFlex>
                    <CubeFlex
                        style={{
                            // background: isRightClick ? "" : token.controlItemBgActive,
                            color: isRightClick ? "" : token.colorTextDisabled
                        }}
                    >
                        <ArrowRightOutlined onClick={rightClick}/>
                    </CubeFlex>
                    <CubeFlex
                        style={{
                            // background: isParentClick ? "" : "#262626",
                            color: isParentClick ? "" : token.colorTextDisabled
                        }}
                    >
                        <VerticalAlignTopOutlined onClick={parentClick}/>
                    </CubeFlex>
                    <CubeFlex>
                        <RedoOutlined onClick={getFolder}/>
                    </CubeFlex>
                    <CubeFlex
                        // style={{marginLeft: "5px"}}
                    >
                        <FolderAddOutlined onClick={showModal}/>
                    </CubeFlex>
                    {/*<div style={{*/}
                    {/*    width: '100px',*/}
                    {/*    border: '1px solid #555',*/}
                    {/*    height: '25px',*/}
                    {/*    lineHeight: '25px',*/}
                    {/*    paddingLeft: '5px'*/}
                    {/*}}>*/}
                    {/*    {path}*/}
                    {/*</div>*/}
                    {/*<div className="controls" style={{marginLeft: "20px"}}>*/}
                    {/*<SearchBar/>*/}
                    {/*<ViewOptions/>*/}
                    {/*</div>*/}
                </Flex>
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
                                    key={index} onClick={() => selectPath(item)}
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
                                key={index} onClick={() => selectPath(item)}
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
        </div>
    )
}