import {Button, Dropdown} from "antd";
import {useViewer} from "../../store";
import {ExporterTool} from "@plum-render/babylon-sdk";
import {useParams} from "react-router-dom";
import {useRef} from "react";
import {type Id} from "react-toastify";
import {MenuItem} from "./MenuItem.tsx";

enum FileFormat {
    GLB = "GLB",
    GLTF = "GLTF",
    USDZ = "USDZ",
    STL = "STL",
    OBJ = "OBJ",
}

export  function FileMenu() {
    const viewer = useViewer();
    const {appId} = useParams();
    const handleNew = () => {
        console.log("新建被点击");
    };

    const handleOpen = () => {
        console.log("打开被点击");
    };
    const toastId = useRef<Id>(null);
    const handleSave = async () => {
        console.log("保存被点击");
        const serializer = viewer?.serializer
        if (serializer) {
            serializer.pack().then(() => {

            });
        }
    };
    const handleZipSave = () => {
        console.log("保存被点击");
    };

    const downloadNative = async () => {
        const scene = viewer?.scene
        if (scene) {
            await ExporterTool.getInstance().exportBabylon(scene)
        }
    };

    const downloadZip = async () => {
        const scene = viewer?.scene
        if (scene) {
            await ExporterTool.getInstance().downloadSceneBabylonZip(scene)
        }
    };

    const handleImport = () => {
        console.log("导入被点击");
    };

    const handleExport = (format: FileFormat) => {
        console.log(`导出为 ${format} 格式`);
        switch (format) {
            case FileFormat.GLB: {
                const object = viewer?.scene
                if (object) {
                    ExporterTool.getInstance().exportGLB(object)
                }
                break;
            }
            case FileFormat.GLTF: {
                const object = viewer?.scene
                if (object) {
                    ExporterTool.getInstance().exportGLTF(object)
                }
                break;
            }
            case FileFormat.OBJ: {
                const object = viewer?.scene
                if (object) {
                    ExporterTool.getInstance().exportOBJ(object)
                }
                break;
            }
            case FileFormat.STL: {
                const object = viewer?.scene
                if (object) {
                    ExporterTool.getInstance().exportSTL(object)
                }
                break;
            }
            case FileFormat.USDZ: {
                const object = viewer?.scene
                if (object) {
                    ExporterTool.getInstance().exportUSDZ(object)
                }
                break;
            }
        }
    };

    const items = [
        {
            key: '新建',
            label: (
                <MenuItem name={'新建'} hotKey={'Ctrl N'} onClick={handleNew}/>
            )
        },
        {
            key: '打开',
            label: (
                <MenuItem name={'打开'} hotKey={'Ctrl O'} onClick={handleOpen}/>
            )
        },
        {
            key: '保存',
            label: (
                <MenuItem name={'保存'} onClick={handleSave}/>
            ),
        },
        {
            key: '下载',
            label: (
                <MenuItem name={'下载'}/>
            ),
            children: [
                {
                    key: '原生',
                    label: (
                        <MenuItem name={'原生'} onClick={downloadNative}/>
                    )
                },
                {
                    key: '压缩',
                    label: (
                        <MenuItem name={'压缩'} onClick={downloadZip}/>
                    )
                },
            ]
        },
        {
            key: '导入',
            label: (
                <MenuItem name={'导入'} onClick={handleImport}/>
            )
        },
        {
            key: '导出',
            label: '导出',
            children: Object.values(FileFormat).map(format => ({
                key: format,
                label: (
                    <MenuItem name={format} onClick={() => handleExport(format)}/>
                )
            }))
        }
    ];

    return (
        <Dropdown menu={{items}} overlayClassName={'plum-menu-dropDown'} placement="bottomLeft">
            <Button type="text">
                <div className="font-semibold">
                    文件
                </div>
            </Button>
        </Dropdown>
    );
}

