import {Button, Dropdown} from "antd";
import {useViewer} from "../../store";
import {defaultExporterTool} from "@plum-render/babylon-sdk";
import {useParams} from "react-router";
import {useRef} from "react";
import {type Id} from "react-toastify";
import {MenuItem} from "./MenuItem.tsx";
import {Tools} from "@babylonjs/core";
import {ApplicationApi} from "../../api";

enum FileFormat {
    GLB = "GLB",
    GLTF = "GLTF",
    USDZ = "USDZ",
    STL = "STL",
    OBJ = "OBJ",
}

export function FileMenu() {
    const viewer = useViewer();
    const {appId} = useParams();
    const toastId = useRef<Id>(null);
    const handleSave = async () => {
        console.log("保存被点击");
        const serializer = viewer?.serializer
        if (viewer && serializer) {
            serializer.pack().then(() => {
            });
            Tools.CreateScreenshot(viewer.scene.getEngine(), viewer.scene.activeCamera!, {precision: 1}, (data) => {
                console.log("截图", data);
                ApplicationApi.edit({id: Number(appId), thumbnailBase64: data}).then((res) => {
                })
            });
        }
    };
    const handleZipSave = () => {
        console.log("保存被点击");
    };

    const downloadNative = async () => {
        const scene = viewer?.scene
        if (scene) {
            await defaultExporterTool.exportBabylon(scene)
        }
    };

    const downloadZip = async () => {
        const scene = viewer?.scene
        if (scene) {
            await defaultExporterTool.downloadSceneBabylonZip(scene)
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
                    defaultExporterTool.exportGLB(object)
                }
                break;
            }
            case FileFormat.GLTF: {
                const object = viewer?.scene
                if (object) {
                    defaultExporterTool.exportGLTF(object)
                }
                break;
            }
            case FileFormat.OBJ: {
                const object = viewer?.scene
                if (object) {
                    defaultExporterTool.exportOBJ(object)
                }
                break;
            }
            case FileFormat.STL: {
                const object = viewer?.scene
                if (object) {
                    defaultExporterTool.exportSTL(object)
                }
                break;
            }
            case FileFormat.USDZ: {
                const object = viewer?.scene
                if (object) {
                    defaultExporterTool.exportUSDZ(object)
                }
                break;
            }
        }
    };

    const items = [
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

