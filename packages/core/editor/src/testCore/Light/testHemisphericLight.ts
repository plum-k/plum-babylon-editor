const testHemisphericLight = (_viewer) => {
    const hemisphereLight = new HemisphericLight("HemisphereLight", new Vector3(0, 1, 0),);
    hemisphereLight.groundColor = new Color3(0.4, 0.4, 0.4);
    _viewer?.editor.addObjectCommandExecute({
        source: "editor",
        object: hemisphereLight
    });
}
export default testHemisphericLight