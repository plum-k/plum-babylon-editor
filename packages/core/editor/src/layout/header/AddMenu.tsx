import {useEffect} from "react";
import {Button, Dropdown, MenuProps} from "antd";
import {isNil} from "lodash-es";
import {useViewer} from "../../store";
import {
    Color3,
    DirectionalLight,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    PointLight,
    SpotLight,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import { MenuItem } from "./MenuItem";

export  function AddMenu() {
    const viewer = useViewer()
    useEffect(() => {
    }, [viewer])
    const HandleClick = (name: string) => {
        console.log(name)
        if (isNil(viewer)) {
            return
        }
        switch (name) {
            case "group":
                const transformNode = new TransformNode("TransformNode");
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: transformNode
                });
                break;
            case "plane":
                const plane = MeshBuilder.CreatePlane("Plane", {
                    height: 2,
                    width: 1,
                    sideOrientation: Mesh.DOUBLESIDE
                });
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: plane
                });
                break;
            case "box":
                const box = MeshBuilder.CreateBox("Box", {size: 1});
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: box
                });
                break;
            case "capsule":
                const capsule = MeshBuilder.CreateCapsule("Capsule", {height: 2},);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: capsule
                });
                break;
            case "Disc":
                const circle = MeshBuilder.CreateDisc("Disc", {
                    radius: 0.5,
                    tessellation: 32,
                    sideOrientation: Mesh.DOUBLESIDE
                },);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: circle
                });
                break;
            case "cylinder":
                const cylinder = MeshBuilder.CreateCylinder("Cylinder", {
                    diameterTop: 1,
                    diameterBottom: 1,
                    height: 2
                },);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: cylinder
                });
                break;
            case "Torus":
                const ring = MeshBuilder.CreateTorus("Torus", {diameter: 1, thickness: 0.2},);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: ring
                });
                break;
            case "sphere":
                const sphere = MeshBuilder.CreateSphere("Sphere", {diameter: 1},);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: sphere
                });
                break;
            case "torus":
                const torus = MeshBuilder.CreateTorus("Torus", {diameter: 1, thickness: 0.2},);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: torus
                });
                break;
            case "tube":
                const tube = MeshBuilder.CreateTube("Tube", {
                    path: [new Vector3(-1, 0, 0), new Vector3(-0.5, 1, 0), new Vector3(0.5, 1, 0), new Vector3(1, 0, 0)],
                    radius: 0.2,
                    tessellation: 64
                },);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: tube
                });
                break;
            case "PointLight":
                PointLight
                const pointLight = new PointLight("PointLight", new Vector3(0, 2, 2),);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: pointLight
                });
                break;
            case "SpotLight":
                const spotLight = new SpotLight("SpotLight", new Vector3(2, 2, 2), new Vector3(0, -1, 0), Math.PI / 6, 0.5,);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: spotLight
                });
                break;
            case "DirectionalLight":
                const directionalLight = new DirectionalLight("DirectionalLight", new Vector3(1, 2, 1),);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: directionalLight
                });
                break;
            case "hemisphereLight":
                const hemisphereLight = new HemisphericLight("HemisphereLight", new Vector3(0, 1, 0),);
                hemisphereLight.groundColor = new Color3(0.4, 0.4, 0.4);
                viewer.editor.addObjectCommandExecute({
                    source: "editor",
                    object: hemisphereLight
                });
                break;
            default:
                console.log(`Unknown geometry type: ${name}`);
                break;
        }
    }

    const meshItems: MenuProps['items'] = [
        {
            key: 'plane',
            label: (
                <MenuItem name={'平面'} onClick={() => HandleClick('plane')}/>
            )
        },
        {
            key: 'box',
            label: (
                <MenuItem name={'正方体'} onClick={() => HandleClick('box')}/>
            )
        },
        {
            key: 'capsule',
            label: (
                <MenuItem name={'胶囊'} onClick={() => HandleClick('capsule')}/>
            )
        },
        {
            key: 'Disc',
            label: (
                <MenuItem name={'圆'} onClick={() => HandleClick('Disc')}/>
            )
        },
        {
            key: 'cylinder',
            label: (
                <MenuItem name={'圆柱体'} onClick={() => HandleClick('cylinder')}/>
            )
        },
        {
            key: 'Torus',
            label: (
                <MenuItem name={'环'} onClick={() => HandleClick('Torus')}/>
            )
        },
        {
            key: 'sphere',
            label: (
                <MenuItem name={'球体'} onClick={() => HandleClick('sphere')}/>
            )
        },
        {
            key: 'torus',
            label: (
                <MenuItem name={'圆环体'} onClick={() => HandleClick('torus')}/>
            )
        },
        {
            key: 'tube',
            label: (
                <MenuItem name={'管'} onClick={() => HandleClick('tube')}/>
            )
        },
        {
            key: 'lathe',
            label: (
                <MenuItem name={'酒杯'} onClick={() => HandleClick('lathe')}/>
            )
        }
    ];
    const lightItems: MenuProps['items'] = [
        {
            key: 'DirectionalLight',
            label: (
                <MenuItem name={'平行光'} onClick={() => HandleClick('DirectionalLight')}/>
            )
        },
        {
            key: 'HemisphereLight',
            label: (
                <MenuItem name={'半球光'} onClick={() => HandleClick('HemisphereLight')}/>
            )
        },
        {
            key: 'PointLight',
            label: (
                <MenuItem name={'点光源'} onClick={() => HandleClick('PointLight')}/>
            )
        },
        {
            key: 'SpotLight',
            label: (
                <MenuItem name={'聚光灯'} onClick={() => HandleClick('SpotLight')}/>
            )
        }
    ];
    const items = [
        {
            key: 'group',
            label: (
                <MenuItem name={'组'} onClick={() => HandleClick('group')}/>
            )
        },
        {
            key: 'mesh',
            label: (
                <MenuItem name={'网格'}/>
            ),
            children: meshItems
        },
        {
            key: 'light',
            label: (
                <MenuItem name={'灯光'}/>
            ),
            children: lightItems
        }
    ];
    return (
        <Dropdown menu={{items}} overlayClassName={'plum-menu-dropDown'} placement="bottomLeft">
            <Button type="text">
                <div className="font-semibold">
                    添加
                </div>
            </Button>
        </Dropdown>
    )
}

