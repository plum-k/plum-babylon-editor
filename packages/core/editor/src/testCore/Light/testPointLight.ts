const testPointLight = (_viewer) => {
    const pointLight = new PointLight("PointLight", new Vector3(0, 2, 2),);
    _viewer?.editor.addObjectCommandExecute({
        source: "editor",
        object: pointLight
    });
}
export default testPointLight