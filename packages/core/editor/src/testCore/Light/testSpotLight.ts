const testSpotLight = (viewer) => {
    const spotLight = new SpotLight("SpotLight", new Vector3(2, 2, 2), new Vector3(0, -1, 0), Math.PI / 6, 0.5,);
    viewer?.editor.addObjectCommandExecute({
        source: "editor",
        object: spotLight
    });
}

export default testSpotLight