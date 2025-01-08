const testDirectionalLight = (_viewer) => {
    const directionalLight = new DirectionalLight("DirectionalLight", new Vector3(1, 2, 1),);
    _viewer?.editor.addObjectCommandExecute({
        source: "editor",
        object: directionalLight
    });
}
export default testDirectionalLight