<script lang="ts" setup>
import {NButton, NLayout, NLayoutHeader, NLayoutSider, NSpin, NSplit} from 'naive-ui'
import {onMounted, ref} from 'vue'
import Menu from './components/Menu.vue'
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import isProduction from "./tool/isProduction.ts";

// ----------------- 编辑器相关-开始
let editor: monaco.editor.IStandaloneCodeEditor | undefined = undefined;
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};
const initEditor = () => {
  editor = monaco.editor.create(document.getElementById("editorArea")!, {
    value: "",
    language: "html",
    // theme: "vs-dark"
    scrollbar: {
      horizontal: "visible",
      horizontalHasArrows: false,
      horizontalScrollbarSize: 14,
      horizontalSliderSize: 6,
      vertical: "visible",
      verticalHasArrows: false,
      verticalScrollbarSize: 14,
      verticalSliderSize: 6,
    }
  });
};
onMounted(() => {
  initEditor();
});
// ----------------- 编辑器相关-结束

//------------------ 分割面板相关-开始

const onDragStart = (event: any) => {
  console.log("onDragStart")
  iframeStyle.value.pointerEvents = 'none';
}
const onDragEnd = (event: any) => {
  console.log("onDragEnd")
  iframeStyle.value.pointerEvents = 'auto';
}
const handleOnDragMove = (event: any) => {
  console.log("onDragMove")
  if (editor) {
    editor.layout();
  }
}
// ----------------- 分割面板相关-结束


const iframeRef = ref<HTMLIFrameElement | null>(null);
const iframeStyle = ref({
  pointerEvents: 'auto',
})
let codeValue = ref("");
let show = ref(true);

const replaceImport = (key: string, value: string) => {
  const is = isProduction();
  if (is) {
    return value.replace("Vite App", key).replace(/.\/@babylonjs/g, "https://oss.nikolas.xin/%40babylonjs")
  } else {
    return value.replace("Vite App", key).replace(/.\/@babylonjs/g, "https://oss.nikolas.xin/%40babylonjs")
  }
}
const change = (key: string, value: string) => {
  const iframe = iframeRef.value;
  if (editor && iframe) {
    show.value = true;
    value = replaceImport(key, value);
    codeValue.value = value;
    editor.setValue(value);
    (iframeRef.value as HTMLIFrameElement).srcdoc = value;
    show.value = false;
  }
}


const run = () => {
  if (editor && iframeRef.value) {
    show.value = true;
    const value = editor.getValue();
    console.log(value);
    (iframeRef.value as HTMLIFrameElement).srcdoc = value
    show.value = false;
  }
}
const reset = () => {
  if (editor && iframeRef.value) {
    show.value = true;
    editor.setValue(codeValue.value);
    (iframeRef.value as HTMLIFrameElement).srcdoc = editor!.getValue();
    show.value = false;
  }
}

</script>

<template>
  <n-layout position="absolute">
    <n-layout-header bordered style="height: 64px; padding: 24px">
      <div>
        <!--        plum-render-example-babylon-->
      </div>
    </n-layout-header>
    <n-layout has-sider position="absolute" style="top: 64px">
      <n-layout-sider :width="200" bordered content-style="">
        <Menu @change="change"/>
      </n-layout-sider>
      <n-layout content-style="">
        <n-split direction="horizontal" @drag-start="onDragStart" @drag-end="onDragEnd" @drag-move="handleOnDragMove">
          <template #1>
            <div style="text-align: right">
              <n-button quaternary type="primary" @click="run">
                运行
              </n-button>
              <n-button quaternary type="primary" @click="reset">
                重置
              </n-button>
            </div>
            <div id="editorArea"/>
          </template>
          <template #2>
            <n-spin :content-style="{ height: '100%' }" :show="show">
              <iframe id="code-iframe" ref="iframeRef" style="border:none"/>
            </n-spin>
          </template>
        </n-split>
      </n-layout>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.n-spin-container {
  height: 100% !important;
}

#editorArea {
  height: calc(100% - 34px);
  position: relative;
}

#code-iframe {
  pointer-events: v-bind("iframeStyle.pointerEvents");
  height: 100%;
  width: 100%;
}
</style>
