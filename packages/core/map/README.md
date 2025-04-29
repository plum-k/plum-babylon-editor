## @plum-render/babylon-sdk

对 `babylon` 的简单封装, 可以快速创建三维应用


```html
<script type="importmap">
    {
      "imports": {
        "tweakpane": "./tweakpane.min.js",
        "@plum-render/babylon-sdk": "./plum-render-babylon-sdk.js",
        "@babylonjs/core": "./@babylonjs/core/index.js",
        "@babylonjs/loaders": "./@babylonjs/loaders/index.js",
        "@babylonjs/materials": "./@babylonjs/materials/index.js",
        "@babylonjs/serializers": "./@babylonjs/serializers/index.js",
        "@babylonjs/havok": "./@babylonjs/havok/HavokPhysics_es.js",
        "@babylonjs/core/": "./@babylonjs/core/",
        "@babylonjs/loaders/": "./@babylonjs/loaders/"
      }
    }
</script>
<script type="module">
    import {MeshBuilder, Viewer} from "./plum-render-babylon-sdk.js";
    import {Pane} from "tweakpane";
</script>
```
