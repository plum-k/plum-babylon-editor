import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Geometry } from "@babylonjs/core/Meshes/geometry.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
/**
 * Class used to load mesh data from OBJ content
 */
export class SolidParser {
    /**
     * Creates a new SolidParser
     * @param materialToUse defines the array to fill with the list of materials to use (it will be filled by the parse function)
     * @param babylonMeshesArray defines the array to fill with the list of loaded meshes (it will be filled by the parse function)
     * @param loadingOptions defines the loading options to use
     */
    constructor(materialToUse, babylonMeshesArray, loadingOptions) {
        this._positions = []; //values for the positions of vertices
        this._normals = []; //Values for the normals
        this._uvs = []; //Values for the textures
        this._colors = [];
        this._extColors = []; //Extension color
        this._meshesFromObj = []; //[mesh] Contains all the obj meshes
        this._indicesForBabylon = []; //The list of indices for VertexData
        this._wrappedPositionForBabylon = []; //The list of position in vectors
        this._wrappedUvsForBabylon = []; //Array with all value of uvs to match with the indices
        this._wrappedColorsForBabylon = []; // Array with all color values to match with the indices
        this._wrappedNormalsForBabylon = []; //Array with all value of normals to match with the indices
        this._tuplePosNorm = []; //Create a tuple with indice of Position, Normal, UV  [pos, norm, uvs]
        this._curPositionInIndices = 0;
        this._hasMeshes = false; //Meshes are defined in the file
        this._unwrappedPositionsForBabylon = []; //Value of positionForBabylon w/o Vector3() [x,y,z]
        this._unwrappedColorsForBabylon = []; // Value of colorForBabylon w/o Color4() [r,g,b,a]
        this._unwrappedNormalsForBabylon = []; //Value of normalsForBabylon w/o Vector3()  [x,y,z]
        this._unwrappedUVForBabylon = []; //Value of uvsForBabylon w/o Vector3()      [x,y,z]
        this._triangles = []; //Indices from new triangles coming from polygons
        this._materialNameFromObj = ""; //The name of the current material
        this._objMeshName = ""; //The name of the current obj mesh
        this._increment = 1; //Id for meshes created by the multimaterial
        this._isFirstMaterial = true;
        this._grayColor = new Color4(0.5, 0.5, 0.5, 1);
        this._hasLineData = false; //If this mesh has line segment(l) data
        this._materialToUse = materialToUse;
        this._babylonMeshesArray = babylonMeshesArray;
        this._loadingOptions = loadingOptions;
    }
    /**
     * Search for obj in the given array.
     * This function is called to check if a couple of data already exists in an array.
     *
     * If found, returns the index of the founded tuple index. Returns -1 if not found
     * @param arr Array<{ normals: Array<number>, idx: Array<number> }>
     * @param obj Array<number>
     * @returns {boolean}
     */
    _isInArray(arr, obj) {
        if (!arr[obj[0]]) {
            arr[obj[0]] = { normals: [], idx: [] };
        }
        const idx = arr[obj[0]].normals.indexOf(obj[1]);
        return idx === -1 ? -1 : arr[obj[0]].idx[idx];
    }
    _isInArrayUV(arr, obj) {
        if (!arr[obj[0]]) {
            arr[obj[0]] = { normals: [], idx: [], uv: [] };
        }
        const idx = arr[obj[0]].normals.indexOf(obj[1]);
        if (idx != 1 && obj[2] === arr[obj[0]].uv[idx]) {
            return arr[obj[0]].idx[idx];
        }
        return -1;
    }
    /**
     * This function set the data for each triangle.
     * Data are position, normals and uvs
     * If a tuple of (position, normal) is not set, add the data into the corresponding array
     * If the tuple already exist, add only their indice
     *
     * @param indicePositionFromObj Integer The index in positions array
     * @param indiceUvsFromObj Integer The index in uvs array
     * @param indiceNormalFromObj Integer The index in normals array
     * @param positionVectorFromOBJ Vector3 The value of position at index objIndice
     * @param textureVectorFromOBJ Vector3 The value of uvs
     * @param normalsVectorFromOBJ Vector3 The value of normals at index objNormale
     * @param positionColorsFromOBJ
     */
    _setData(indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, positionVectorFromOBJ, textureVectorFromOBJ, normalsVectorFromOBJ, positionColorsFromOBJ) {
        //Check if this tuple already exists in the list of tuples
        let _index;
        if (this._loadingOptions.optimizeWithUV) {
            _index = this._isInArrayUV(this._tuplePosNorm, [indicePositionFromObj, indiceNormalFromObj, indiceUvsFromObj]);
        }
        else {
            _index = this._isInArray(this._tuplePosNorm, [indicePositionFromObj, indiceNormalFromObj]);
        }
        //If it not exists
        if (_index === -1) {
            //Add an new indice.
            //The array of indices is only an array with his length equal to the number of triangles - 1.
            //We add vertices data in this order
            this._indicesForBabylon.push(this._wrappedPositionForBabylon.length);
            //Push the position of vertice for Babylon
            //Each element is a Vector3(x,y,z)
            this._wrappedPositionForBabylon.push(positionVectorFromOBJ);
            //Push the uvs for Babylon
            //Each element is a Vector2(u,v)
            //If the UVs are missing, set (u,v)=(0,0)
            textureVectorFromOBJ = textureVectorFromOBJ ?? new Vector2(0, 0);
            this._wrappedUvsForBabylon.push(textureVectorFromOBJ);
            //Push the normals for Babylon
            //Each element is a Vector3(x,y,z)
            this._wrappedNormalsForBabylon.push(normalsVectorFromOBJ);
            if (positionColorsFromOBJ !== undefined) {
                //Push the colors for Babylon
                //Each element is a BABYLON.Color4(r,g,b,a)
                this._wrappedColorsForBabylon.push(positionColorsFromOBJ);
            }
            //Add the tuple in the comparison list
            this._tuplePosNorm[indicePositionFromObj].normals.push(indiceNormalFromObj);
            this._tuplePosNorm[indicePositionFromObj].idx.push(this._curPositionInIndices++);
            if (this._loadingOptions.optimizeWithUV) {
                this._tuplePosNorm[indicePositionFromObj].uv.push(indiceUvsFromObj);
            }
        }
        else {
            //The tuple already exists
            //Add the index of the already existing tuple
            //At this index we can get the value of position, normal, color and uvs of vertex
            this._indicesForBabylon.push(_index);
        }
    }
    /**
     * Transform Vector() and BABYLON.Color() objects into numbers in an array
     */
    _unwrapData() {
        try {
            //Every array has the same length
            for (let l = 0; l < this._wrappedPositionForBabylon.length; l++) {
                //Push the x, y, z values of each element in the unwrapped array
                this._unwrappedPositionsForBabylon.push(this._wrappedPositionForBabylon[l].x * this._handednessSign, this._wrappedPositionForBabylon[l].y, this._wrappedPositionForBabylon[l].z);
                this._unwrappedNormalsForBabylon.push(this._wrappedNormalsForBabylon[l].x * this._handednessSign, this._wrappedNormalsForBabylon[l].y, this._wrappedNormalsForBabylon[l].z);
                this._unwrappedUVForBabylon.push(this._wrappedUvsForBabylon[l].x, this._wrappedUvsForBabylon[l].y); //z is an optional value not supported by BABYLON
                if (this._loadingOptions.importVertexColors) {
                    //Push the r, g, b, a values of each element in the unwrapped array
                    this._unwrappedColorsForBabylon.push(this._wrappedColorsForBabylon[l].r, this._wrappedColorsForBabylon[l].g, this._wrappedColorsForBabylon[l].b, this._wrappedColorsForBabylon[l].a);
                }
            }
            // Reset arrays for the next new meshes
            this._wrappedPositionForBabylon.length = 0;
            this._wrappedNormalsForBabylon.length = 0;
            this._wrappedUvsForBabylon.length = 0;
            this._wrappedColorsForBabylon.length = 0;
            this._tuplePosNorm.length = 0;
            this._curPositionInIndices = 0;
        }
        catch (e) {
            throw new Error("Unable to unwrap data while parsing OBJ data.");
        }
    }
    /**
     * Create triangles from polygons
     * It is important to notice that a triangle is a polygon
     * We get 5 patterns of face defined in OBJ File :
     * facePattern1 = ["1","2","3","4","5","6"]
     * facePattern2 = ["1/1","2/2","3/3","4/4","5/5","6/6"]
     * facePattern3 = ["1/1/1","2/2/2","3/3/3","4/4/4","5/5/5","6/6/6"]
     * facePattern4 = ["1//1","2//2","3//3","4//4","5//5","6//6"]
     * facePattern5 = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-4/-4/-4","-5/-5/-5","-6/-6/-6"]
     * Each pattern is divided by the same method
     * @param faces Array[String] The indices of elements
     * @param v Integer The variable to increment
     */
    _getTriangles(faces, v) {
        //Work for each element of the array
        for (let faceIndex = v; faceIndex < faces.length - 1; faceIndex++) {
            //Add on the triangle variable the indexes to obtain triangles
            this._pushTriangle(faces, faceIndex);
        }
        //Result obtained after 2 iterations:
        //Pattern1 => triangle = ["1","2","3","1","3","4"];
        //Pattern2 => triangle = ["1/1","2/2","3/3","1/1","3/3","4/4"];
        //Pattern3 => triangle = ["1/1/1","2/2/2","3/3/3","1/1/1","3/3/3","4/4/4"];
        //Pattern4 => triangle = ["1//1","2//2","3//3","1//1","3//3","4//4"];
        //Pattern5 => triangle = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-1/-1/-1","-3/-3/-3","-4/-4/-4"];
    }
    /**
     * To get color between color and extension color
     * @param index Integer The index of the element in the array
     * @returns value of target color
     */
    _getColor(index) {
        if (this._loadingOptions.importVertexColors) {
            return this._extColors[index] ?? this._colors[index];
        }
        else {
            return undefined;
        }
    }
    /**
     * Create triangles and push the data for each polygon for the pattern 1
     * In this pattern we get vertice positions
     * @param face
     * @param v
     */
    _setDataForCurrentFaceWithPattern1(face, v) {
        //Get the indices of triangles for each polygon
        this._getTriangles(face, v);
        //For each element in the triangles array.
        //This var could contains 1 to an infinity of triangles
        for (let k = 0; k < this._triangles.length; k++) {
            // Set position indice
            const indicePositionFromObj = parseInt(this._triangles[k]) - 1;
            this._setData(indicePositionFromObj, 0, 0, // In the pattern 1, normals and uvs are not defined
            this._positions[indicePositionFromObj], // Get the vectors data
            Vector2.Zero(), Vector3.Up(), // Create default vectors
            this._getColor(indicePositionFromObj));
        }
        //Reset variable for the next line
        this._triangles.length = 0;
    }
    /**
     * Create triangles and push the data for each polygon for the pattern 2
     * In this pattern we get vertice positions and uvs
     * @param face
     * @param v
     */
    _setDataForCurrentFaceWithPattern2(face, v) {
        //Get the indices of triangles for each polygon
        this._getTriangles(face, v);
        for (let k = 0; k < this._triangles.length; k++) {
            //triangle[k] = "1/1"
            //Split the data for getting position and uv
            const point = this._triangles[k].split("/"); // ["1", "1"]
            //Set position indice
            const indicePositionFromObj = parseInt(point[0]) - 1;
            //Set uv indice
            const indiceUvsFromObj = parseInt(point[1]) - 1;
            this._setData(indicePositionFromObj, indiceUvsFromObj, 0, //Default value for normals
            this._positions[indicePositionFromObj], //Get the values for each element
            this._uvs[indiceUvsFromObj] ?? Vector2.Zero(), Vector3.Up(), //Default value for normals
            this._getColor(indicePositionFromObj));
        }
        //Reset variable for the next line
        this._triangles.length = 0;
    }
    /**
     * Create triangles and push the data for each polygon for the pattern 3
     * In this pattern we get vertice positions, uvs and normals
     * @param face
     * @param v
     */
    _setDataForCurrentFaceWithPattern3(face, v) {
        //Get the indices of triangles for each polygon
        this._getTriangles(face, v);
        for (let k = 0; k < this._triangles.length; k++) {
            //triangle[k] = "1/1/1"
            //Split the data for getting position, uv, and normals
            const point = this._triangles[k].split("/"); // ["1", "1", "1"]
            // Set position indice
            const indicePositionFromObj = parseInt(point[0]) - 1;
            // Set uv indice
            const indiceUvsFromObj = parseInt(point[1]) - 1;
            // Set normal indice
            const indiceNormalFromObj = parseInt(point[2]) - 1;
            this._setData(indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, this._positions[indicePositionFromObj], this._uvs[indiceUvsFromObj] ?? Vector2.Zero(), this._normals[indiceNormalFromObj] ?? Vector3.Up() //Set the vector for each component
            );
        }
        //Reset variable for the next line
        this._triangles.length = 0;
    }
    /**
     * Create triangles and push the data for each polygon for the pattern 4
     * In this pattern we get vertice positions and normals
     * @param face
     * @param v
     */
    _setDataForCurrentFaceWithPattern4(face, v) {
        this._getTriangles(face, v);
        for (let k = 0; k < this._triangles.length; k++) {
            //triangle[k] = "1//1"
            //Split the data for getting position and normals
            const point = this._triangles[k].split("//"); // ["1", "1"]
            // We check indices, and normals
            const indicePositionFromObj = parseInt(point[0]) - 1;
            const indiceNormalFromObj = parseInt(point[1]) - 1;
            this._setData(indicePositionFromObj, 1, //Default value for uv
            indiceNormalFromObj, this._positions[indicePositionFromObj], //Get each vector of data
            Vector2.Zero(), this._normals[indiceNormalFromObj], this._getColor(indicePositionFromObj));
        }
        //Reset variable for the next line
        this._triangles.length = 0;
    }
    /*
     * Create triangles and push the data for each polygon for the pattern 3
     * In this pattern we get vertice positions, uvs and normals
     * @param face
     * @param v
     */
    _setDataForCurrentFaceWithPattern5(face, v) {
        //Get the indices of triangles for each polygon
        this._getTriangles(face, v);
        for (let k = 0; k < this._triangles.length; k++) {
            //triangle[k] = "-1/-1/-1"
            //Split the data for getting position, uv, and normals
            const point = this._triangles[k].split("/"); // ["-1", "-1", "-1"]
            // Set position indice
            const indicePositionFromObj = this._positions.length + parseInt(point[0]);
            // Set uv indice
            const indiceUvsFromObj = this._uvs.length + parseInt(point[1]);
            // Set normal indice
            const indiceNormalFromObj = this._normals.length + parseInt(point[2]);
            this._setData(indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj, this._positions[indicePositionFromObj], this._uvs[indiceUvsFromObj], this._normals[indiceNormalFromObj], //Set the vector for each component
            this._getColor(indicePositionFromObj));
        }
        //Reset variable for the next line
        this._triangles.length = 0;
    }
    _addPreviousObjMesh() {
        //Check if it is not the first mesh. Otherwise we don't have data.
        if (this._meshesFromObj.length > 0) {
            //Get the previous mesh for applying the data about the faces
            //=> in obj file, faces definition append after the name of the mesh
            this._handledMesh = this._meshesFromObj[this._meshesFromObj.length - 1];
            //Set the data into Array for the mesh
            this._unwrapData();
            if (this._loadingOptions.useLegacyBehavior) {
                // Reverse tab. Otherwise face are displayed in the wrong sens
                this._indicesForBabylon.reverse();
            }
            //Set the information for the mesh
            //Slice the array to avoid rewriting because of the fact this is the same var which be rewrited
            this._handledMesh.indices = this._indicesForBabylon.slice();
            this._handledMesh.positions = this._unwrappedPositionsForBabylon.slice();
            this._handledMesh.normals = this._unwrappedNormalsForBabylon.slice();
            this._handledMesh.uvs = this._unwrappedUVForBabylon.slice();
            this._handledMesh.hasLines = this._hasLineData;
            if (this._loadingOptions.importVertexColors) {
                this._handledMesh.colors = this._unwrappedColorsForBabylon.slice();
            }
            //Reset the array for the next mesh
            this._indicesForBabylon.length = 0;
            this._unwrappedPositionsForBabylon.length = 0;
            this._unwrappedColorsForBabylon.length = 0;
            this._unwrappedNormalsForBabylon.length = 0;
            this._unwrappedUVForBabylon.length = 0;
            this._hasLineData = false;
        }
    }
    _optimizeNormals(mesh) {
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
        const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
        const mapVertices = {};
        if (!positions || !normals) {
            return;
        }
        for (let i = 0; i < positions.length / 3; i++) {
            const x = positions[i * 3 + 0];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            const key = x + "_" + y + "_" + z;
            let lst = mapVertices[key];
            if (!lst) {
                lst = [];
                mapVertices[key] = lst;
            }
            lst.push(i);
        }
        const normal = new Vector3();
        for (const key in mapVertices) {
            const lst = mapVertices[key];
            if (lst.length < 2) {
                continue;
            }
            const v0Idx = lst[0];
            for (let i = 1; i < lst.length; ++i) {
                const vIdx = lst[i];
                normals[v0Idx * 3 + 0] += normals[vIdx * 3 + 0];
                normals[v0Idx * 3 + 1] += normals[vIdx * 3 + 1];
                normals[v0Idx * 3 + 2] += normals[vIdx * 3 + 2];
            }
            normal.copyFromFloats(normals[v0Idx * 3 + 0], normals[v0Idx * 3 + 1], normals[v0Idx * 3 + 2]);
            normal.normalize();
            for (let i = 0; i < lst.length; ++i) {
                const vIdx = lst[i];
                normals[vIdx * 3 + 0] = normal.x;
                normals[vIdx * 3 + 1] = normal.y;
                normals[vIdx * 3 + 2] = normal.z;
            }
        }
        mesh.setVerticesData(VertexBuffer.NormalKind, normals);
    }
    static _IsLineElement(line) {
        return line.startsWith("l");
    }
    static _IsObjectElement(line) {
        return line.startsWith("o");
    }
    static _IsGroupElement(line) {
        return line.startsWith("g");
    }
    static _GetZbrushMRGB(line, notParse) {
        if (!line.startsWith("mrgb"))
            return null;
        line = line.replace("mrgb", "").trim();
        // if include vertex color , not load mrgb anymore
        if (notParse)
            return [];
        const regex = /[a-z0-9]/g;
        const regArray = line.match(regex);
        if (!regArray || regArray.length % 8 !== 0) {
            return [];
        }
        const array = [];
        for (let regIndex = 0; regIndex < regArray.length / 8; regIndex++) {
            //each item is MMRRGGBB, m is material index
            // const m = regArray[regIndex * 8 + 0] + regArray[regIndex * 8 + 1];
            const r = regArray[regIndex * 8 + 2] + regArray[regIndex * 8 + 3];
            const g = regArray[regIndex * 8 + 4] + regArray[regIndex * 8 + 5];
            const b = regArray[regIndex * 8 + 6] + regArray[regIndex * 8 + 7];
            array.push(new Color4(parseInt(r, 16) / 255, parseInt(g, 16) / 255, parseInt(b, 16) / 255, 1));
        }
        return array;
    }
    /**
     * Function used to parse an OBJ string
     * @param meshesNames defines the list of meshes to load (all if not defined)
     * @param data defines the OBJ string
     * @param scene defines the hosting scene
     * @param assetContainer defines the asset container to load data in
     * @param onFileToLoadFound defines a callback that will be called if a MTL file is found
     */
    parse(meshesNames, data, scene, assetContainer, onFileToLoadFound) {
        //Move Santitize here to forbid delete zbrush data
        // Sanitize data
        data = data.replace(/#MRGB/g, "mrgb");
        data = data.replace(/#.*$/gm, "").trim();
        if (this._loadingOptions.useLegacyBehavior) {
            this._pushTriangle = (faces, faceIndex) => this._triangles.push(faces[0], faces[faceIndex], faces[faceIndex + 1]);
            this._handednessSign = 1;
        }
        else if (scene.useRightHandedSystem) {
            this._pushTriangle = (faces, faceIndex) => this._triangles.push(faces[0], faces[faceIndex + 1], faces[faceIndex]);
            this._handednessSign = 1;
        }
        else {
            this._pushTriangle = (faces, faceIndex) => this._triangles.push(faces[0], faces[faceIndex], faces[faceIndex + 1]);
            this._handednessSign = -1;
        }
        // Split the file into lines
        // Preprocess line data
        const linesOBJ = data.split("\n");
        const lineLines = [];
        let currentGroup = [];
        lineLines.push(currentGroup);
        for (let i = 0; i < linesOBJ.length; i++) {
            const line = linesOBJ[i].trim().replace(/\s\s/g, " ");
            // Comment or newLine
            if (line.length === 0 || line.charAt(0) === "#") {
                continue;
            }
            if (SolidParser._IsGroupElement(line) || SolidParser._IsObjectElement(line)) {
                currentGroup = [];
                lineLines.push(currentGroup);
            }
            if (SolidParser._IsLineElement(line)) {
                const lineValues = line.split(" ");
                // create line elements with two vertices only
                for (let i = 1; i < lineValues.length - 1; i++) {
                    currentGroup.push(`l ${lineValues[i]} ${lineValues[i + 1]}`);
                }
            }
            else {
                currentGroup.push(line);
            }
        }
        const lines = lineLines.flat();
        // Look at each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().replace(/\s\s/g, " ");
            let result;
            // Comment or newLine
            if (line.length === 0 || line.charAt(0) === "#") {
                continue;
            }
            else if (SolidParser.VertexPattern.test(line)) {
                //Get information about one position possible for the vertices
                result = line.match(/[^ ]+/g); // match will return non-null due to passing regex pattern
                // Value of result with line: "v 1.0 2.0 3.0"
                // ["v", "1.0", "2.0", "3.0"]
                // Create a Vector3 with the position x, y, z
                this._positions.push(new Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
                if (this._loadingOptions.importVertexColors) {
                    if (result.length >= 7) {
                        const r = parseFloat(result[4]);
                        const g = parseFloat(result[5]);
                        const b = parseFloat(result[6]);
                        this._colors.push(new Color4(r > 1 ? r / 255 : r, g > 1 ? g / 255 : g, b > 1 ? b / 255 : b, result.length === 7 || result[7] === undefined ? 1 : parseFloat(result[7])));
                    }
                    else {
                        // TODO: maybe push NULL and if all are NULL to skip (and remove grayColor var).
                        this._colors.push(this._grayColor);
                    }
                }
            }
            else if ((result = SolidParser.NormalPattern.exec(line)) !== null) {
                //Create a Vector3 with the normals x, y, z
                //Value of result
                // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
                //Add the Vector in the list of normals
                this._normals.push(new Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
            }
            else if ((result = SolidParser.UVPattern.exec(line)) !== null) {
                //Create a Vector2 with the normals u, v
                //Value of result
                // ["vt 0.1 0.2 0.3", "0.1", "0.2"]
                //Add the Vector in the list of uvs
                this._uvs.push(new Vector2(parseFloat(result[1]) * this._loadingOptions.UVScaling.x, parseFloat(result[2]) * this._loadingOptions.UVScaling.y));
                //Identify patterns of faces
                //Face could be defined in different type of pattern
            }
            else if ((result = SolidParser.FacePattern3.exec(line)) !== null) {
                //Value of result:
                //["f 1/1/1 2/2/2 3/3/3", "1/1/1 2/2/2 3/3/3"...]
                //Set the data for this face
                this._setDataForCurrentFaceWithPattern3(result[1].trim().split(" "), // ["1/1/1", "2/2/2", "3/3/3"]
                1);
            }
            else if ((result = SolidParser.FacePattern4.exec(line)) !== null) {
                //Value of result:
                //["f 1//1 2//2 3//3", "1//1 2//2 3//3"...]
                //Set the data for this face
                this._setDataForCurrentFaceWithPattern4(result[1].trim().split(" "), // ["1//1", "2//2", "3//3"]
                1);
            }
            else if ((result = SolidParser.FacePattern5.exec(line)) !== null) {
                //Value of result:
                //["f -1/-1/-1 -2/-2/-2 -3/-3/-3", "-1/-1/-1 -2/-2/-2 -3/-3/-3"...]
                //Set the data for this face
                this._setDataForCurrentFaceWithPattern5(result[1].trim().split(" "), // ["-1/-1/-1", "-2/-2/-2", "-3/-3/-3"]
                1);
            }
            else if ((result = SolidParser.FacePattern2.exec(line)) !== null) {
                //Value of result:
                //["f 1/1 2/2 3/3", "1/1 2/2 3/3"...]
                //Set the data for this face
                this._setDataForCurrentFaceWithPattern2(result[1].trim().split(" "), // ["1/1", "2/2", "3/3"]
                1);
            }
            else if ((result = SolidParser.FacePattern1.exec(line)) !== null) {
                //Value of result
                //["f 1 2 3", "1 2 3"...]
                //Set the data for this face
                this._setDataForCurrentFaceWithPattern1(result[1].trim().split(" "), // ["1", "2", "3"]
                1);
                // Define a mesh or an object
                // Each time this keyword is analyzed, create a new Object with all data for creating a babylonMesh
            }
            else if ((result = SolidParser.LinePattern1.exec(line)) !== null) {
                //Value of result
                //["l 1 2"]
                //Set the data for this face
                this._setDataForCurrentFaceWithPattern1(result[1].trim().split(" "), // ["1", "2"]
                0);
                this._hasLineData = true;
                // Define a mesh or an object
                // Each time this keyword is analyzed, create a new Object with all data for creating a babylonMesh
            }
            else if ((result = SolidParser.LinePattern2.exec(line)) !== null) {
                //Value of result
                //["l 1/1 2/2"]
                //Set the data for this face
                this._setDataForCurrentFaceWithPattern2(result[1].trim().split(" "), // ["1/1", "2/2"]
                0);
                this._hasLineData = true;
                // Define a mesh or an object
                // Each time this keyword is analyzed, create a new Object with all data for creating a babylonMesh
            }
            else if ((result = SolidParser._GetZbrushMRGB(line, !this._loadingOptions.importVertexColors))) {
                result.forEach((element) => {
                    this._extColors.push(element);
                });
            }
            else if ((result = SolidParser.LinePattern3.exec(line)) !== null) {
                //Value of result
                //["l 1/1/1 2/2/2"]
                //Set the data for this face
                this._setDataForCurrentFaceWithPattern3(result[1].trim().split(" "), // ["1/1/1", "2/2/2"]
                0);
                this._hasLineData = true;
                // Define a mesh or an object
                // Each time this keyword is analyzed, create a new Object with all data for creating a babylonMesh
            }
            else if (SolidParser.GroupDescriptor.test(line) || SolidParser.ObjectDescriptor.test(line)) {
                // Create a new mesh corresponding to the name of the group.
                // Definition of the mesh
                const objMesh = {
                    name: line.substring(2).trim(), //Set the name of the current obj mesh
                    indices: null,
                    positions: null,
                    normals: null,
                    uvs: null,
                    colors: null,
                    materialName: this._materialNameFromObj,
                    isObject: SolidParser.ObjectDescriptor.test(line),
                };
                this._addPreviousObjMesh();
                //Push the last mesh created with only the name
                this._meshesFromObj.push(objMesh);
                //Set this variable to indicate that now meshesFromObj has objects defined inside
                this._hasMeshes = true;
                this._isFirstMaterial = true;
                this._increment = 1;
                //Keyword for applying a material
            }
            else if (SolidParser.UseMtlDescriptor.test(line)) {
                //Get the name of the material
                this._materialNameFromObj = line.substring(7).trim();
                //If this new material is in the same mesh
                if (!this._isFirstMaterial || !this._hasMeshes) {
                    //Set the data for the previous mesh
                    this._addPreviousObjMesh();
                    //Create a new mesh
                    const objMesh = 
                    //Set the name of the current obj mesh
                    {
                        name: (this._objMeshName || "mesh") + "_mm" + this._increment.toString(), //Set the name of the current obj mesh
                        indices: null,
                        positions: null,
                        normals: null,
                        uvs: null,
                        colors: null,
                        materialName: this._materialNameFromObj,
                        isObject: false,
                    };
                    this._increment++;
                    //If meshes are already defined
                    this._meshesFromObj.push(objMesh);
                    this._hasMeshes = true;
                }
                //Set the material name if the previous line define a mesh
                if (this._hasMeshes && this._isFirstMaterial) {
                    //Set the material name to the previous mesh (1 material per mesh)
                    this._meshesFromObj[this._meshesFromObj.length - 1].materialName = this._materialNameFromObj;
                    this._isFirstMaterial = false;
                }
                // Keyword for loading the mtl file
            }
            else if (SolidParser.MtlLibGroupDescriptor.test(line)) {
                // Get the name of mtl file
                onFileToLoadFound(line.substring(7).trim());
                // Apply smoothing
            }
            else if (SolidParser.SmoothDescriptor.test(line)) {
                // smooth shading => apply smoothing
                // Today I don't know it work with babylon and with obj.
                // With the obj file  an integer is set
            }
            else {
                //If there is another possibility
                Logger.Log("Unhandled expression at line : " + line);
            }
        }
        // At the end of the file, add the last mesh into the meshesFromObj array
        if (this._hasMeshes) {
            // Set the data for the last mesh
            this._handledMesh = this._meshesFromObj[this._meshesFromObj.length - 1];
            if (this._loadingOptions.useLegacyBehavior) {
                //Reverse indices for displaying faces in the good sense
                this._indicesForBabylon.reverse();
            }
            //Get the good array
            this._unwrapData();
            //Set array
            this._handledMesh.indices = this._indicesForBabylon;
            this._handledMesh.positions = this._unwrappedPositionsForBabylon;
            this._handledMesh.normals = this._unwrappedNormalsForBabylon;
            this._handledMesh.uvs = this._unwrappedUVForBabylon;
            this._handledMesh.hasLines = this._hasLineData;
            if (this._loadingOptions.importVertexColors) {
                this._handledMesh.colors = this._unwrappedColorsForBabylon;
            }
        }
        // If any o or g keyword not found, create a mesh with a random id
        if (!this._hasMeshes) {
            let newMaterial = null;
            if (this._indicesForBabylon.length) {
                if (this._loadingOptions.useLegacyBehavior) {
                    // reverse tab of indices
                    this._indicesForBabylon.reverse();
                }
                //Get positions normals uvs
                this._unwrapData();
            }
            else {
                // There is no indices in the file. We will have to switch to point cloud rendering
                for (const pos of this._positions) {
                    this._unwrappedPositionsForBabylon.push(pos.x, pos.y, pos.z);
                }
                if (this._normals.length) {
                    for (const normal of this._normals) {
                        this._unwrappedNormalsForBabylon.push(normal.x, normal.y, normal.z);
                    }
                }
                if (this._uvs.length) {
                    for (const uv of this._uvs) {
                        this._unwrappedUVForBabylon.push(uv.x, uv.y);
                    }
                }
                if (this._extColors.length) {
                    for (const color of this._extColors) {
                        this._unwrappedColorsForBabylon.push(color.r, color.g, color.b, color.a);
                    }
                }
                else {
                    if (this._colors.length) {
                        for (const color of this._colors) {
                            this._unwrappedColorsForBabylon.push(color.r, color.g, color.b, color.a);
                        }
                    }
                }
                if (!this._materialNameFromObj) {
                    // Create a material with point cloud on
                    newMaterial = new StandardMaterial(Geometry.RandomId(), scene);
                    newMaterial.pointsCloud = true;
                    this._materialNameFromObj = newMaterial.name;
                    if (!this._normals.length) {
                        newMaterial.disableLighting = true;
                        newMaterial.emissiveColor = Color3.White();
                    }
                }
            }
            //Set data for one mesh
            this._meshesFromObj.push({
                name: Geometry.RandomId(),
                indices: this._indicesForBabylon,
                positions: this._unwrappedPositionsForBabylon,
                colors: this._unwrappedColorsForBabylon,
                normals: this._unwrappedNormalsForBabylon,
                uvs: this._unwrappedUVForBabylon,
                materialName: this._materialNameFromObj,
                directMaterial: newMaterial,
                isObject: true,
                hasLines: this._hasLineData,
            });
        }
        //Set data for each mesh
        for (let j = 0; j < this._meshesFromObj.length; j++) {
            //check meshesNames (stlFileLoader)
            if (meshesNames && this._meshesFromObj[j].name) {
                if (meshesNames instanceof Array) {
                    if (meshesNames.indexOf(this._meshesFromObj[j].name) === -1) {
                        continue;
                    }
                }
                else {
                    if (this._meshesFromObj[j].name !== meshesNames) {
                        continue;
                    }
                }
            }
            //Get the current mesh
            //Set the data with VertexBuffer for each mesh
            this._handledMesh = this._meshesFromObj[j];
            //Create a Mesh with the name of the obj mesh
            scene._blockEntityCollection = !!assetContainer;
            const babylonMesh = new Mesh(this._meshesFromObj[j].name, scene);
            babylonMesh._parentContainer = assetContainer;
            scene._blockEntityCollection = false;
            this._handledMesh._babylonMesh = babylonMesh;
            // If this is a group mesh, it should have an object mesh as a parent. So look for the first object mesh that appears before it.
            if (!this._handledMesh.isObject) {
                for (let k = j - 1; k >= 0; --k) {
                    if (this._meshesFromObj[k].isObject && this._meshesFromObj[k]._babylonMesh) {
                        babylonMesh.parent = this._meshesFromObj[k]._babylonMesh;
                        break;
                    }
                }
            }
            //Push the name of the material to an array
            //This is indispensable for the importMesh function
            this._materialToUse.push(this._meshesFromObj[j].materialName);
            //If the mesh is a line mesh
            if (this._handledMesh.hasLines) {
                babylonMesh._internalMetadata ?? (babylonMesh._internalMetadata = {});
                babylonMesh._internalMetadata["_isLine"] = true; //this is a line mesh
            }
            if (this._handledMesh.positions?.length === 0) {
                //Push the mesh into an array
                this._babylonMeshesArray.push(babylonMesh);
                continue;
            }
            const vertexData = new VertexData(); //The container for the values
            //Set the data for the babylonMesh
            vertexData.uvs = this._handledMesh.uvs;
            vertexData.indices = this._handledMesh.indices;
            vertexData.positions = this._handledMesh.positions;
            if (this._loadingOptions.computeNormals) {
                const normals = new Array();
                VertexData.ComputeNormals(this._handledMesh.positions, this._handledMesh.indices, normals);
                vertexData.normals = normals;
            }
            else {
                vertexData.normals = this._handledMesh.normals;
            }
            if (this._loadingOptions.importVertexColors) {
                vertexData.colors = this._handledMesh.colors;
            }
            //Set the data from the VertexBuffer to the current Mesh
            vertexData.applyToMesh(babylonMesh);
            if (this._loadingOptions.invertY) {
                babylonMesh.scaling.y *= -1;
            }
            if (this._loadingOptions.optimizeNormals) {
                this._optimizeNormals(babylonMesh);
            }
            //Push the mesh into an array
            this._babylonMeshesArray.push(babylonMesh);
            if (this._handledMesh.directMaterial) {
                babylonMesh.material = this._handledMesh.directMaterial;
            }
        }
    }
}
// Descriptor
/** Object descriptor */
SolidParser.ObjectDescriptor = /^o/;
/** Group descriptor */
SolidParser.GroupDescriptor = /^g/;
/** Material lib descriptor */
SolidParser.MtlLibGroupDescriptor = /^mtllib /;
/** Use a material descriptor */
SolidParser.UseMtlDescriptor = /^usemtl /;
/** Smooth descriptor */
SolidParser.SmoothDescriptor = /^s /;
// Patterns
/** Pattern used to detect a vertex */
SolidParser.VertexPattern = /^v(\s+[\d|.|+|\-|e|E]+){3,7}/;
/** Pattern used to detect a normal */
SolidParser.NormalPattern = /^vn(\s+[\d|.|+|\-|e|E]+)( +[\d|.|+|\-|e|E]+)( +[\d|.|+|\-|e|E]+)/;
/** Pattern used to detect a UV set */
SolidParser.UVPattern = /^vt(\s+[\d|.|+|\-|e|E]+)( +[\d|.|+|\-|e|E]+)/;
/** Pattern used to detect a first kind of face (f vertex vertex vertex) */
SolidParser.FacePattern1 = /^f\s+(([\d]{1,}[\s]?){3,})+/;
/** Pattern used to detect a second kind of face (f vertex/uvs vertex/uvs vertex/uvs) */
SolidParser.FacePattern2 = /^f\s+((([\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
/** Pattern used to detect a third kind of face (f vertex/uvs/normal vertex/uvs/normal vertex/uvs/normal) */
SolidParser.FacePattern3 = /^f\s+((([\d]{1,}\/[\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
/** Pattern used to detect a fourth kind of face (f vertex//normal vertex//normal vertex//normal)*/
SolidParser.FacePattern4 = /^f\s+((([\d]{1,}\/\/[\d]{1,}[\s]?){3,})+)/;
/** Pattern used to detect a fifth kind of face (f -vertex/-uvs/-normal -vertex/-uvs/-normal -vertex/-uvs/-normal) */
SolidParser.FacePattern5 = /^f\s+(((-[\d]{1,}\/-[\d]{1,}\/-[\d]{1,}[\s]?){3,})+)/;
/** Pattern used to detect a line(l vertex vertex) */
SolidParser.LinePattern1 = /^l\s+(([\d]{1,}[\s]?){2,})+/;
/** Pattern used to detect a second kind of line (l vertex/uvs vertex/uvs) */
SolidParser.LinePattern2 = /^l\s+((([\d]{1,}\/[\d]{1,}[\s]?){2,})+)/;
/** Pattern used to detect a third kind of line (l vertex/uvs/normal vertex/uvs/normal) */
SolidParser.LinePattern3 = /^l\s+((([\d]{1,}\/[\d]{1,}\/[\d]{1,}[\s]?){2,})+)/;
//# sourceMappingURL=solidParser.js.map