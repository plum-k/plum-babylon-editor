import {CSSProperties, FC, Fragment, PropsWithChildren, useEffect, useMemo, useState} from "react";
import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    FileFilled,
    FolderAddOutlined,
    FolderFilled,
    RedoOutlined,
    VerticalAlignTopOutlined
} from "@ant-design/icons";
import {Flex, Form, Input, Modal} from "antd";
import {COSApi} from "cos-api";
import { IFolder } from "../interface";
import {useToken} from "../hooks";

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

export const FilePane: FC = () => {
    const token = useToken()
    const [folders, setFolders] = useState<Array<IFolder>>([]);
    const [path, setPath] = useState<string>("/");
    const [history, setHistory] = useState<Array<string>>(["/"]);
    const [currentNum, setCurrentNum] = useState<number>(0);
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
    const getFolder = () => {
        COSApi.getBucket({
            Prefix: path === "/" ? "" : path,
            Delimiter: "/"
        }).then((data) => {
            // console.log(data)
            setFolders(data)
        })
    }
    const selectPath = (item: IFolder) => {
        // item.name;
        // setPath(path)
        if (item.type === EFolder.FOLDER) {
            setCurrentNum(history.length + 1)
            setHistory([...history, item.name])
            setPath(item.name);
        } else {

        }
    }
    useEffect(() => {
        getFolder();
    }, [path]);

    const getName = (item: IFolder) => {
        if (item.type === EFolder.FOLDER) {
            return item.name.slice(0, -1);
        } else {

        }
        return item.name;
    }

    const parentClick = () => {
        const count = countOccurrences(path, "/")
        if (count === 1) {
            let node: IFolder = {
                type: EFolder.FOLDER,
                name: "/"
            }
            selectPath(node)
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
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

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
    const [form] = Form.useForm();

    const handlerDragstart = (e: React.DragEvent<HTMLDivElement>, item: IFolder) => {
        e.dataTransfer.setData("data", JSON.stringify(item))
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
                    <div style={{
                        width: '100px',
                        border: '1px solid #555',
                        height: '25px',
                        lineHeight: '25px',
                        paddingLeft: '5px'
                    }}>
                        {path}
                    </div>
                    {/*<div className="controls" style={{marginLeft: "20px"}}>*/}
                    {/*<SearchBar/>*/}
                    {/*<ViewOptions/>*/}
                    {/*</div>*/}
                </Flex>
                <div className="folder-container">
                    <div className="folder-grid">
                        {folders.map((item, index) => {
                            const isFolder = item.type === EFolder.FOLDER;
                            return <div
                                style={{
                                    background: token.colorBgLayout,
                                    borderRadius: token.borderRadiusLG,
                                    textAlign: "center",
                                    width: "80px",
                                    height: "80px",
                                }}

                                key={index} onClick={() => selectPath(item)}
                                onDragStart={(e) => handlerDragstart(e, item)}
                                className="folder" draggable={!isFolder}>
                                <div className="folder-icon">
                                    {
                                        isFolder ?
                                            <FolderFilled/> :
                                            <FileFilled/>
                                    }
                                </div>
                                <div className="folder-name">{getName(item)}</div>
                            </div>
                        })}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

