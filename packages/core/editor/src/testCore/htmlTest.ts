import {HtmlMesh} from "babylon-htmlmesh";

const htmlTest = (_viewer) => {
    const pdfUrl = 'https://cdn.glitch.com/3da1885b-3463-4252-8ded-723332b5de34%2FNew_Horizons.pdf#zoom=75?v=1599831745689'
    const htmlMeshPdf = new HtmlMesh(_viewer.scene, "html-mesh-pdf");
    const iframePdf = document.createElement('iframe');
    iframePdf.style.background = "red";
    iframePdf.src = pdfUrl;
    iframePdf.width = '480px';
    iframePdf.height = '360px';
    htmlMeshPdf.setContent(iframePdf, 4, 3);
    htmlMeshPdf.position.x = 3;
    htmlMeshPdf.position.y = 2;
}
export default htmlTest;

