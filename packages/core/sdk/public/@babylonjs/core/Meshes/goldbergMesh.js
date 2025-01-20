import { Vector3 } from "../Maths/math.vector.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Mesh } from "../Meshes/mesh.js";
import { Color4 } from "../Maths/math.color.js";
import { Logger } from "../Misc/logger.js";
Mesh._GoldbergMeshParser = (parsedMesh, scene) => {
    return GoldbergMesh.Parse(parsedMesh, scene);
};
/**
 * Mesh for a Goldberg Polyhedron which is made from 12 pentagonal and the rest hexagonal faces
 * @see https://en.wikipedia.org/wiki/Goldberg_polyhedron
 */
export class GoldbergMesh extends Mesh {
    constructor() {
        super(...arguments);
        /**
         * Defines the specific Goldberg data used in this mesh construction.
         */
        this.goldbergData = {
            faceColors: [],
            faceCenters: [],
            faceZaxis: [],
            faceXaxis: [],
            faceYaxis: [],
            nbSharedFaces: 0,
            nbUnsharedFaces: 0,
            nbFaces: 0,
            nbFacesAtPole: 0,
            adjacentFaces: [],
        };
    }
    /**
     * Gets the related Goldberg face from pole infos
     * @param poleOrShared Defines the pole index or the shared face index if the fromPole parameter is passed in
     * @param fromPole Defines an optional pole index to find the related info from
     * @returns the goldberg face number
     */
    relatedGoldbergFace(poleOrShared, fromPole) {
        if (fromPole === void 0) {
            if (poleOrShared > this.goldbergData.nbUnsharedFaces - 1) {
                Logger.Warn("Maximum number of unshared faces used");
                poleOrShared = this.goldbergData.nbUnsharedFaces - 1;
            }
            return this.goldbergData.nbUnsharedFaces + poleOrShared;
        }
        if (poleOrShared > 11) {
            Logger.Warn("Last pole used");
            poleOrShared = 11;
        }
        if (fromPole > this.goldbergData.nbFacesAtPole - 1) {
            Logger.Warn("Maximum number of faces at a pole used");
            fromPole = this.goldbergData.nbFacesAtPole - 1;
        }
        return 12 + poleOrShared * this.goldbergData.nbFacesAtPole + fromPole;
    }
    _changeGoldbergFaceColors(colorRange) {
        for (let i = 0; i < colorRange.length; i++) {
            const min = colorRange[i][0];
            const max = colorRange[i][1];
            const col = colorRange[i][2];
            for (let f = min; f < max + 1; f++) {
                this.goldbergData.faceColors[f] = col;
            }
        }
        const newCols = [];
        for (let f = 0; f < 12; f++) {
            for (let i = 0; i < 5; i++) {
                newCols.push(this.goldbergData.faceColors[f].r, this.goldbergData.faceColors[f].g, this.goldbergData.faceColors[f].b, this.goldbergData.faceColors[f].a);
            }
        }
        for (let f = 12; f < this.goldbergData.faceColors.length; f++) {
            for (let i = 0; i < 6; i++) {
                newCols.push(this.goldbergData.faceColors[f].r, this.goldbergData.faceColors[f].g, this.goldbergData.faceColors[f].b, this.goldbergData.faceColors[f].a);
            }
        }
        return newCols;
    }
    /**
     * Set new goldberg face colors
     * @param colorRange the new color to apply to the mesh
     */
    setGoldbergFaceColors(colorRange) {
        const newCols = this._changeGoldbergFaceColors(colorRange);
        this.setVerticesData(VertexBuffer.ColorKind, newCols);
    }
    /**
     * Updates new goldberg face colors
     * @param colorRange the new color to apply to the mesh
     */
    updateGoldbergFaceColors(colorRange) {
        const newCols = this._changeGoldbergFaceColors(colorRange);
        this.updateVerticesData(VertexBuffer.ColorKind, newCols);
    }
    _changeGoldbergFaceUVs(uvRange) {
        const uvs = this.getVerticesData(VertexBuffer.UVKind);
        for (let i = 0; i < uvRange.length; i++) {
            const min = uvRange[i][0];
            const max = uvRange[i][1];
            const center = uvRange[i][2];
            const radius = uvRange[i][3];
            const angle = uvRange[i][4];
            const points5 = [];
            const points6 = [];
            let u;
            let v;
            for (let p = 0; p < 5; p++) {
                u = center.x + radius * Math.cos(angle + (p * Math.PI) / 2.5);
                v = center.y + radius * Math.sin(angle + (p * Math.PI) / 2.5);
                if (u < 0) {
                    u = 0;
                }
                if (u > 1) {
                    u = 1;
                }
                points5.push(u, v);
            }
            for (let p = 0; p < 6; p++) {
                u = center.x + radius * Math.cos(angle + (p * Math.PI) / 3);
                v = center.y + radius * Math.sin(angle + (p * Math.PI) / 3);
                if (u < 0) {
                    u = 0;
                }
                if (u > 1) {
                    u = 1;
                }
                points6.push(u, v);
            }
            for (let f = min; f < Math.min(12, max + 1); f++) {
                for (let p = 0; p < 5; p++) {
                    uvs[10 * f + 2 * p] = points5[2 * p];
                    uvs[10 * f + 2 * p + 1] = points5[2 * p + 1];
                }
            }
            for (let f = Math.max(12, min); f < max + 1; f++) {
                for (let p = 0; p < 6; p++) {
                    //120 + 12 * (f - 12) = 12 * f - 24
                    uvs[12 * f - 24 + 2 * p] = points6[2 * p];
                    uvs[12 * f - 23 + 2 * p] = points6[2 * p + 1];
                }
            }
        }
        return uvs;
    }
    /**
     * set new goldberg face UVs
     * @param uvRange the new UVs to apply to the mesh
     */
    setGoldbergFaceUVs(uvRange) {
        const newUVs = this._changeGoldbergFaceUVs(uvRange);
        this.setVerticesData(VertexBuffer.UVKind, newUVs);
    }
    /**
     * Updates new goldberg face UVs
     * @param uvRange the new UVs to apply to the mesh
     */
    updateGoldbergFaceUVs(uvRange) {
        const newUVs = this._changeGoldbergFaceUVs(uvRange);
        this.updateVerticesData(VertexBuffer.UVKind, newUVs);
    }
    /**
     * Places a mesh on a particular face of the goldberg polygon
     * @param mesh Defines the mesh to position
     * @param face Defines the face to position onto
     * @param position Defines the position relative to the face we are positioning the mesh onto
     */
    placeOnGoldbergFaceAt(mesh, face, position) {
        const orientation = Vector3.RotationFromAxis(this.goldbergData.faceXaxis[face], this.goldbergData.faceYaxis[face], this.goldbergData.faceZaxis[face]);
        mesh.rotation = orientation;
        mesh.position = this.goldbergData.faceCenters[face]
            .add(this.goldbergData.faceXaxis[face].scale(position.x))
            .add(this.goldbergData.faceYaxis[face].scale(position.y))
            .add(this.goldbergData.faceZaxis[face].scale(position.z));
    }
    /**
     * Serialize current mesh
     * @param serializationObject defines the object which will receive the serialization data
     */
    serialize(serializationObject) {
        super.serialize(serializationObject);
        serializationObject.type = "GoldbergMesh";
        const goldbergData = {};
        goldbergData.adjacentFaces = this.goldbergData.adjacentFaces;
        goldbergData.nbSharedFaces = this.goldbergData.nbSharedFaces;
        goldbergData.nbUnsharedFaces = this.goldbergData.nbUnsharedFaces;
        goldbergData.nbFaces = this.goldbergData.nbFaces;
        goldbergData.nbFacesAtPole = this.goldbergData.nbFacesAtPole;
        if (this.goldbergData.faceColors) {
            goldbergData.faceColors = [];
            for (const color of this.goldbergData.faceColors) {
                goldbergData.faceColors.push(color.asArray());
            }
        }
        if (this.goldbergData.faceCenters) {
            goldbergData.faceCenters = [];
            for (const vector of this.goldbergData.faceCenters) {
                goldbergData.faceCenters.push(vector.asArray());
            }
        }
        if (this.goldbergData.faceZaxis) {
            goldbergData.faceZaxis = [];
            for (const vector of this.goldbergData.faceZaxis) {
                goldbergData.faceZaxis.push(vector.asArray());
            }
        }
        if (this.goldbergData.faceYaxis) {
            goldbergData.faceYaxis = [];
            for (const vector of this.goldbergData.faceYaxis) {
                goldbergData.faceYaxis.push(vector.asArray());
            }
        }
        if (this.goldbergData.faceXaxis) {
            goldbergData.faceXaxis = [];
            for (const vector of this.goldbergData.faceXaxis) {
                goldbergData.faceXaxis.push(vector.asArray());
            }
        }
        serializationObject.goldbergData = goldbergData;
    }
    /**
     * Parses a serialized goldberg mesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the goldberg mesh in
     * @returns the created goldberg mesh
     */
    static Parse(parsedMesh, scene) {
        const goldbergData = parsedMesh.goldbergData;
        goldbergData.faceColors = goldbergData.faceColors.map((el) => Color4.FromArray(el));
        goldbergData.faceCenters = goldbergData.faceCenters.map((el) => Vector3.FromArray(el));
        goldbergData.faceZaxis = goldbergData.faceZaxis.map((el) => Vector3.FromArray(el));
        goldbergData.faceXaxis = goldbergData.faceXaxis.map((el) => Vector3.FromArray(el));
        goldbergData.faceYaxis = goldbergData.faceYaxis.map((el) => Vector3.FromArray(el));
        const goldberg = new GoldbergMesh(parsedMesh.name, scene);
        goldberg.goldbergData = goldbergData;
        return goldberg;
    }
}
//# sourceMappingURL=goldbergMesh.js.map