---
title: "我完成了markitdown_GUI的开发"
date: 2026-08-13
categories: [日记]
---

今天我利用 AI 搭建了 markitdown 的 GUI，用的模型是 DeepSeek-v4-flash ，但是确实完成得很出色，几乎没有严重 BUG。可惜，我还是选择了一股脑做到底，现在该返回去学习一下相关细节了

有关的内容：
- HTML/Vue 标签 和 属性
- Vue 框架的参数传递，事件通信
- js 的 变量定义，逻辑控制

# Vue
一个基本结构如下
``` html
<template>
  XXX
</template>

<script>
export default{
  data() {
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
      
    }
  }
}
</script>

```

`v-model` 将HTML的数据跟script中的数据绑定在一起
`v-for + v-bind(:)` 实现循环，可以用来操控列表
注意 `v-for` 具有以下结构, 使用的key应该是不会重复的值
``` 
v-for="(xx, index) in XXX" :key="index" 
```

### 数据交互
HTML 标签
- `<input>` 输入框
  - `<input type="number">`
  - `<input type="radio" name="属性（绑定相同的组名便只能输入最后的选项）" value="...">` 单选
- `<select>` 下拉选项框

### CSS
基本结构如下
``` css
.类名 [可携带标签名]{

}
```
当只有类名的时候，可以设置一些全局的属性
当携带标签名的时候，就可以单独调控单个标签的属性