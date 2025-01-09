import {Key, useEffect, useMemo, useRef, useState} from 'react';
import {Input, Tree, TreeDataNode, type TreeProps} from 'antd';
import {Item, ItemParams, Menu as RightMenu, useContextMenu} from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import {isNil} from "lodash-es";
import {EyeInvisibleOutlined, EyeOutlined} from '@ant-design/icons';
import {useSelectObject3D, useSetSelectKey, useSetSelectObject3D, useViewer} from "../store";
import {useToggle} from "ahooks";
import {isMesh, isTransformNode} from 'babylon-is';
import "../styles/SceneTree.css";
import {NodeTool, Viewer} from '@plum-render/babylon-sdk';
import {Node} from "@babylonjs/core";

const getTree = (objects: Array<Node>) => {
    const nodes: Array<any> = [];
    for (let i = 0, l = objects.length; i < l; i++) {
        const node = objects[i];
        const {name, uniqueId,} = node;
        const children = node.getChildren()
        const visible = NodeTool.getVisibleNode(node)
        const isShowVisibleIcon = !isTransformNode(node);

        let nodeInfo: any = {
            title: name,
            name: name,
            key: uniqueId,
            children: [],
            visible: visible,
            isShowVisibleIcon: isShowVisibleIcon,
        };
        if (children.length !== 0) {
            nodeInfo.children = getTree(children);
        }
        nodes.push(nodeInfo);
    }
    return nodes
}

const getSceneTree = (viewer: Viewer) => {
    const rootNodes = viewer.scene.rootNodes.slice(0);
    return getTree(rootNodes);
}

export default function SceneTree() {
    const viewer = useViewer();
    const setSelectObject3D = useSetSelectObject3D()
    const setSelectKey = useSetSelectKey()
    const selectObject3D = useSelectObject3D()
    const [inputValue, setInputValue] = useState('');
    const [searchState, {toggle, setLeft, setRight}] = useToggle();

    const [isVisible, setVisible] = useState(false)
    const [selectedKeys, setSelectedKeys] = useState<Array<Key>>([]);

    useEffect(() => {
        if (viewer) {
            viewer?.editor.editorEventManager.sceneGraphChanged.subscribe((value) => {
                if (value) {
                    updateTree()
                } else {
                }
            })
            viewer?.editor.editorEventManager.objectSelected.subscribe((node) => {
                console.log("选择对象", node)
                setSelectObject3D(node)
                if (node) {
                    setExpandedKeys((prevState) => {
                        return [...prevState, node.uniqueId]
                    }); // 更新展开的节点
                    window.setTimeout(() => {
                        const tree = treeRef.current;
                        if (tree) {
                            // @ts-ignore
                            tree.scrollTo({key: node.uniqueId}); // 滚动到选中的节点
                        }
                    }, 500)
                }
            })
        }
    }, [viewer])


    const updateTree = () => {
        if (viewer) {
            let baseTreeData = getSceneTree(viewer);
            setBaseTreeData(baseTreeData);
        }
    }

    const onSelect: TreeProps["onSelect"] = (electedKeys) => {
        setSelectKey(electedKeys)
        const length = electedKeys.length;
        if (length > 0) {
            const select = electedKeys[0];
            const node = viewer?.getNodeByUniqueId(select as number);
            if (node) {
                viewer?.editor.select.select(node)
            }
        }
    }
    useEffect(() => {
        if (isNil(selectObject3D)) {
            setSelectedKeys([]);
        } else {
            setSelectedKeys([selectObject3D.uniqueId]);
        }
    }, [selectObject3D])
    const [baseTreeData, setBaseTreeData] = useState<TreeDataNode[]>([]);
    // 处理搜索输入并过滤树节点
    const treeData = useMemo(() => {
        if (inputValue === "") {
            return baseTreeData;
        }

        // 深度优先遍历剔除不匹配的节点
        function pruneTreeDFS(nodes, condition) {
            return nodes.reduce((acc, node) => {
                const children = node.children ? pruneTreeDFS(node.children, condition) : [];
                if (condition(node) || children.length > 0) {
                    acc.push({...node, children});
                }
                return acc;
            }, []);
        }

        let result = pruneTreeDFS(baseTreeData, (node) => {
            return node.name.includes(inputValue); // 根据输入值过滤节点
        });
        return result;
    }, [baseTreeData, searchState]);
    const onRightClick: TreeProps["onRightClick"] = (info) => {
        const {event, node} = info;
        const {key} = node;
        const SceneNode = viewer?.getNodeByUniqueId(key);
        if (node) {
            setVisible(() => {
                return SceneNode.visible;
            })
        }
        show({
            event: event,
            props: node
        });
    }
    const MENU_ID = 'Menu1';
    const {show} = useContextMenu({
        id: MENU_ID,
    });
    const visible = (value: ItemParams) => {
        const {props} = value;
        const {key} = props;
        const node = viewer?.getNodeByUniqueId(key);
        if (node) {
            NodeTool.toggleVisibility(node)
        }
    }
    const remove = (value: ItemParams) => {
        const {props} = value;
        const {key} = props;
        const node = viewer?.getNodeByUniqueId(key);
        if (node) {
            viewer?.editor.removeObjectExecute({
                source: "editor",
                object: node
            })
        }
    }
    const onDragEnter: TreeProps['onDragEnter'] = (info) => {

    };
    const onDrop: TreeProps['onDrop'] = (info) => {
        // 被拖动的
        const dragNode = info.dragNode;
        const dragNodeKey = dragNode.key;

        // 目标节点
        const node = info.node;
        const nodeKey = node.key;

        viewer?.editor.moveObjectExecute(dragNodeKey as string, nodeKey as string, 1);
        // const dropKey = info.node.key;

    };
    const onDragEnd: TreeProps['onDragEnd'] = (info) => {

    };
    const onDoubleClick: TreeProps['onDoubleClick'] = (info) => {
        if (viewer) {
            if (isMesh(selectObject3D)) {
                viewer.cameraControls.focusOn([selectObject3D]); // 适应选中的对象
            }
        }
    };

    // 处理搜索框输入
    const handleChange = (e) => {
        setInputValue(e.target.value);
    };

    const searchHandle = () => {
        toggle(); // 切换搜索状态
    }

    const onClear = () => {
        setInputValue(""); // 清空搜索框
    }

    useEffect(() => {
        if (inputValue === "") {
            toggle(); // 如果搜索框为空，切换搜索状态
        }
    }, [inputValue]);

    const treeRef = useRef<Tree>(null);
    const [expandedKeys, setExpandedKeys] = useState<Array<number>>([]); // 初始化展开的节点

    // 更新展开的节点
    const onExpand: TreeProps["onExpand"] = (expandedKeysValue, info) => {
        console.log(info)
        if (info.expanded) {
            setExpandedKeys(expandedKeysValue as number[]);
            // 如果节点被展开，则向 expandedKeys 数组添加该节点的 key
            // setExpandedKeys(prevKeys => {
            //     console.log("设置后", uniq([...prevKeys, ...expandedKeysValue as string[]]))
            //     return uniq([...prevKeys, ...expandedKeysValue as string[]])
            // });
        } else {
            let mesh = viewer?.getNodeByUniqueId(info.node.key as number);
            if (mesh) {
                // 查找所有的子节点, 并删除已展开的节点
                mesh.getDescendants(false, (node: Node) => {
                    for (let i = 0; i < expandedKeysValue.length; i++) {
                        if (node.uniqueId === expandedKeysValue[i]) {
                            expandedKeysValue.splice(i, 1);
                            return true;
                        }
                    }
                    return false;
                });
                setExpandedKeys(expandedKeysValue as number[]);
            }
        }
    };
    const treeContainer = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number>(300); // 初始化展开的节点
    useEffect(() => {
        if (treeContainer.current) {
            // 获取当前高度
            const currentHeight = treeContainer.current.offsetHeight;
            setHeight(currentHeight - 40); // 更新高度状态
        }
    }, []);
    const handleVisible = (key: number, value: boolean) => {
        if (viewer) {
            const node = viewer.getNodeByUniqueId(key);
            if (node) {
                viewer.editor.setValueExecute({
                    object: node,
                    attributePath: ["isVisible"],
                    newValue: value
                })
            }
        }
    }

    // 渲染右键菜单
    const RenderRightMenu = () => {
        const visibleText = () => {
            if (selectObject3D) {
                return NodeTool.getVisibleNode(selectObject3D) ? "隐藏" : "显示"
            }
            return ""
        }
        return (
            <RightMenu id={MENU_ID}>
                <Item onClick={visible}>
                    {visibleText()}
                </Item>
                <Item onClick={remove}>
                    删除
                </Item>
            </RightMenu>
        )
    }

    return (
        <div className="bg-white overflow-hidden h-full w-full m-0 pb-5" ref={treeContainer}>
            <div className="p-2">
                <Input.Search placeholder="" onChange={handleChange} allowClear onClear={onClear}
                              onSearch={searchHandle}/>
            </div>
            <RenderRightMenu/>
            <Tree
                ref={treeRef}
                expandedKeys={expandedKeys}
                onExpand={onExpand}
                autoExpandParent
                height={height}
                onSelect={onSelect}
                selectedKeys={selectedKeys}
                showLine
                showIcon
                icon={(props) => {
                    // @ts-ignore
                    let {visible, isShowVisibleIcon, key} = props;

                    if (isShowVisibleIcon) {
                        return visible ? <EyeOutlined onClick={() => handleVisible(key, false)}/> :
                            <EyeInvisibleOutlined onClick={() => handleVisible(key, true)}/>
                    }
                }}
                draggable
                onDoubleClick={onDoubleClick}
                onDragEnter={onDragEnter}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                treeData={treeData}
                onRightClick={onRightClick}
            />
        </div>
    );
};
