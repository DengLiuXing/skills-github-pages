---
title: "我完成了markitdown_GUI的开发"
date: 2026-08-13
categories: [日记]
---

今天我利用 AI 搭建了 markitdown 的 GUI，用的模型是 DeepSeek-v4-flash ，但是确实完成得很出色，几乎没有严重 BUG。可惜，我还是选择了一股脑做到底，现在该返回去学习一下相关细节了

有关的内容：
- [ ] HTML/Vue 标签 和 属性
- [ ] Vue 框架的参数传递，事件通信
- [ ] js 的 变量定义，逻辑控制

# Vue 基本结构
``` html
<template>
  XXX
</template>

<!-- Options API 示例--> 
<script> 
export default{
  data() {
    <!-- 用来声明变量 -->
    const XXX = XXX
    return {
      XXX: XXX,
      xxx: {
        XXX,
        XXX
      }
    }
  },
  methods: {
   XXX () {
      <!-- 用来写事件 -->
    }
  }
}
</script>

<!-- Composition API 示例--> 
<script setup>
import { ref, reactive } from 'vue'

// 基础类型用 ref（需用 .value 读写）
const XXX= ref(xxx)

// 对象/数组用 reactive（直接读写属性，无需 .value）
const XXX = reactive({
  XXX：xxx
})

function XXX() {
}
</script>

```

# 多文件

# 数据交互
### HTML 标签
- `<input>` 输入框
  - `<input type="number">`
  - `<input type="radio" name="属性（绑定相同的组名便只能输入最后的选项）" value="...">` 单选
- `<select>` 下拉选项框

---

### script 中的数据和逻辑

- `v-model` 将HTML的数据跟script中的数据绑定在一起  

- `v-for + v-bind(:)` 实现循环，可以用来操控列表
注意 `v-for` 具有以下结构, 使用的key应该是不会重复的值
  ``` 
  v-for="(xx, index) in XXX" :key="index" 
  ```

- `v-if="xxx"` 实现逻辑判断，后面跟一个布尔类型（其实和普通的数据无异）, 满足该逻辑判断的标签才能显示

- `@xxx` '@' 代表这是一个事件

- var const 和 let 都是可以声明变量的，而且它们的数据都可以被修改，但是 const 所对应的变量不可以整个换成其他的值。也尽量不要使用 var，会污染全局

---

### 使用组件
- 组件的基本结构:
  ``` html
  <template>
      <div>
      </div>
  </template>

  <script>
  <!--这里代表了你引入时需要写的包的名称-->
  export default {
      name: "XXX"
  }
  </script>

  <script setup>
  import { ref } from 'vue';

  const XXX = ref("...")
  const xxx = ref("...")

  <!--你的数据从这里返回-->
  defineExpose({XXX, xxx})
  <!--你的数据从这里传入-->
  defineProps({})

  </script>

  <style>
  </style>
  ```

- 此时你在别的 vue 文件引入包之后，就可以把该组件当做标签一样使用了, 和其他的标签一样可以使用 ref 建立双向连接 (这样就可以把数据传递给调用它的父组件了), 注意这个值在一个 proxy 里面, 需要自己解出来

---

### Composition API
它使 Vue 框架的代码又回归了 JS，用 const 定义变量，用 function 定义事件。
- ref(), 用来定义普通变量，.value 就是那个变量的值
- 可以在标签的属性里面用 ref 和 JS 代码建立双向通信, 此时调用 ref 函数的变量应该和标签里面 ref 属性的命名相同
- reactive(), 用来定义结构体, 很明显，Vue 框架只需在意最外层的那个数据，而结构体里面的数据便不需要使用函数来初始化


说实话，我觉得 Composition API 确实更贴近 JS 技术栈，而且变量和它的函数不会离很远，便于观察和开发

# CSS
基本结构如下
``` css
.类名 [可携带标签名]{

}
```
当只有类名的时候，可以设置一些全局的属性
当携带标签名的时候，就可以单独调控单个标签的属性