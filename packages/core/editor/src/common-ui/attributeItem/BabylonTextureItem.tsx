import {Fragment, useEffect, useMemo, useRef} from "react";
import {Form, type GetProp, type UploadProps} from "antd";
import {get, hasIn} from "lodash-es";
import {useToggle} from "ahooks";
import {BaseItemProps, useObjectAttribute} from "../index.ts";
import {CubeTexture, Texture, TextureTools, Tools} from "@babylonjs/core";
import {useViewer} from "../../store";

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export interface TextureItemProps extends BaseItemProps {
    width?: number;
    height?: number;

    id?: string;
    value?: any;
    onChange?: (value: any) => void;
}

export interface BabylonTextureItemProps extends BaseItemProps {
    width?: number;
    height?: number;
}

const initPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

export function TextureItem(props: TextureItemProps) {
    const {name, width, height, value, onChange,} = {
        width: 32,
        height: 16,
        ...props
    };

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewer = useViewer()
    const [checked, {toggle, setLeft, setRight}] = useToggle(false);
    const {object: material, change} = useObjectAttribute();

    // const texture = material[name] as  Texture;

    const texture = useMemo<Texture>(() => {
        const _texture = get(material, name)
        if (_texture) {
            setRight();
        } else {
            setLeft()
        }
        return _texture
    }, [material, name]);


    const {object, change: ObjectChange} = useObjectAttribute(); // 获取与对象相关的属性
    useEffect(() => {
        if (object) {
            const _texture = get(material, name);
            if (_texture) {
                updatePreview(_texture as Texture).then(r => {
                });
            } else {
                clearCanvas();
            }
        }
    }, [object]); // 依赖于 object，只有当 object 变化时重新运行
    useEffect(() => {
        change?.subscribe((event) => {
            const {attributePath} = event;
            if (name[0] === attributePath[0]) {
                const _texture = get(material, name);
                if (_texture) {
                    updatePreview(_texture as Texture).then(r => {
                    });
                } else {
                    clearCanvas();
                }
            }
        })
    }, [ObjectChange])

    //-------------
    const fileInputRef = useRef<HTMLInputElement>(null);

    const clearCanvas = () => {
        const previewCanvas = canvasRef.current;
        if (!previewCanvas) return
        const context = previewCanvas.getContext("2d");
        if (context) {
            context.clearRect(0, 0, width, height);
        }
    }

    const remove = () => {
        viewer?.editor.setMaterialMapExecute({
            source: "Form",
            object: material,
            attributePath: name,
            newValue: null,
        })
        clearCanvas()
    }
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {files} = e.target;
        let file = files![0]
        Tools.ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], {type: "octet/stream"});
                const url = URL.createObjectURL(blob);
                const extension = file.name.split(".").pop()?.toLowerCase();
                const _texture = false
                    ? new CubeTexture(url, material.getScene(), [], false, undefined, undefined, undefined, undefined, false, extension ? "." + extension : undefined)
                    : new Texture(url, material.getScene(), false, false);

                viewer?.editor.setMaterialMapExecute({
                    source: "Form",
                    object: material,
                    attributePath: name,
                    newValue: _texture,
                })

                updatePreview(_texture as Texture).then(r => {

                });
            },
            undefined,
            true
        );
    };

    // 同步纹理信息到canvas
    const updatePreview = async (texture: Texture) => {
        const previewCanvas = canvasRef.current;
        if (!previewCanvas) return

        const size = texture.getSize();
        // 纹理宽高比
        // const ratio = size.width / size.height;

        try {
            const data = await TextureTools.GetTextureDataAsync(texture, width, height);
            previewCanvas.width = width;
            previewCanvas.height = height;
            const context = previewCanvas.getContext("2d");

            if (context) {
                const imageData = context.createImageData(width, height);
                const castData = imageData.data;
                castData.set(data);
                context.putImageData(imageData, 0, 0);
            }
            previewCanvas.style.height = height + "px";
        } catch (e) {
            previewCanvas.width = width;
            previewCanvas.height = height;
            previewCanvas.style.height = height + "px";
        }
    }

    const canvasClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }
    // 选项开始
    // const CheckboxChange = (value: CheckboxChangeEvent) => {
    //     toggle()
    // }

    function edit() {

    }

    return (
        <Fragment>
            <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
                {/*<Checkbox checked={checked} onChange={CheckboxChange}></Checkbox>*/}
                <input
                    type="file"
                    accept={".jpg, .png, .tga, .dds, .env, .exr"}
                    ref={fileInputRef}
                    style={{display: "none"}}
                    onChange={onFileChange}
                >
                </input>
                <canvas ref={canvasRef} width={width} height={height}
                        style={{border: "2px solid #a49b9b"}}
                        onClick={canvasClick}/>
                <DeleteOutlined style={{fontSize: "16px"}} onClick={remove}/>
            </div>
        </Fragment>
    )
}


/**
 * 直接在内部处理值
 * @param props
 * @constructor
 */
export function BabylonTextureItem(props: BabylonTextureItemProps) {
    const {name, width, height} = {
        width: 32,
        height: 16,
        ...props
    };
    const {object: material,} = useObjectAttribute();

    const isHasValue = useMemo<boolean>(() => {
        return hasIn(material, name)
    }, [material, name]);

    return (
        <Fragment>
            {isHasValue && <Form.Item {...props} className={"BabylonTextureItem"}>
                <TextureItem {...props} />
            </Form.Item>
            }
        </Fragment>
    )
}

