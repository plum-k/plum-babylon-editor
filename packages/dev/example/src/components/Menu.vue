<script lang="ts" setup>
import type {MenuOption} from 'naive-ui'
import {NMenu} from 'naive-ui'
import {nextTick, onMounted, shallowRef} from 'vue'
import {expandedKeys, menuValue} from "../hooks/useMenu.ts";
// function renderIcon(icon: Component) {
//   return () => h(NIcon, null, { default: () => h(icon) })
// }
const templateMap = shallowRef<Map<string, string>>(new Map());
const importModules = import.meta.glob<string>("../examples/**/*.html", {eager: true, query: "raw"});
const keys = Object.keys(importModules);
let baseArray = []
for (let path of keys) {
  baseArray.push(path)
  let name = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf(".html"));
  // console.log(importModules[path].default)
  templateMap.value.set(name, importModules[path].default as unknown as string);
}

function buildTree(paths: Array<string>) {
  const root = {label: '根', children: []};
  for (let i = 0; i < paths.length; i++) {
    let path = paths[i];
    let parts = path.split('/').filter(part => {
      return !(part === ".." || part === "examples")
    }).map((part) => {
      return part.includes('.html') ? part.slice(0, -5) : part
    });
    // 组装树状结构
    let currentNode = root;
    for (let j = 0; j < parts.length; j++) {
      let part = parts[j];
      let existingNode = currentNode.children.find(child => child.label === part);
      if (existingNode) {
        currentNode = existingNode; // 移动到当前节点
      } else {
        // 没有对应的节点，创建新节点, 再从新的节点开始组装
        existingNode = {label: part, key: part,};
        if (j !== parts.length - 1) {
          existingNode.children = []
        }
        currentNode.children.push(existingNode);
        currentNode = existingNode;
      }
    }
  }

  return root;
}

const tree = buildTree(baseArray);
let menuOptions: MenuOption[] = tree.children;

//------------------------
const emit = defineEmits<{
  change: [title: string, value: string]
}>()


function handleUpdateValue(key: string, item?: MenuOption) {
  menuValue.value = key;
  let value = templateMap.value.get(key);
  if (value) {
    emit('change', key, value)
  }
}

function handleUpdateExpanded(keys: string[]) {
  console.log("111", keys)
  expandedKeys.value = keys;
}

onMounted(() => {
  // const currentUrl = new URL(window.location.href);
  // const urlExpandedKeys = currentUrl.searchParams.get('expandedKeys');
  // if (urlExpandedKeys) {
  //   expandedKeys.value = urlExpandedKeys.split(',')
  // }
  // const urlMenuValue = currentUrl.searchParams.get('menuValue');
  //

  nextTick(() => {
    handleUpdateValue(menuValue.value)
  })
})

console.log("从新加载")
</script>

<template>
  <n-menu :expanded-keys="expandedKeys" :options="menuOptions" :value="menuValue" @update:value="handleUpdateValue"
          @update:expanded-keys="handleUpdateExpanded"/>
</template>

<style scoped>

</style>
