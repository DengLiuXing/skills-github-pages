---
title: "Markitdown_GUI_学习总结"
date: 2026-08-12
categories: [日记]
---

# 界面
看一下这是我的 app.view，它的主要视图部分为：
``` html
<template>
  <div class="app">
    <header class="header">
      <h1>MarkItDown Web</h1>
      <p class="subtitle">将文件或网页转换为 Markdown</p>
    </header>

    <main class="main">
      <FileUpload @converted="handleConverted" @error="handleError" @clear="handleClear" />

      <div v-if="error" class="error" @click="error = ''">
        {{ error }}
      </div>

      <MarkdownView
        v-for="item in results"
        :key="item.id"
        :content="item.markdown"
        :filename="item.filename"
        :output-file="item.outputFile"
      />
    </main>
  </div>
</template>
```

你会发现那么大的一个文件上传框和成果预览框，变得只剩下以下部分: `<FileUpload [args] />` ，`<MarkdownView [args] />`

异常优雅！非常适合我这种喜欢一步步拼公式的人的思维方式

至于组件后面的参数，带 ‘：’ 和带 ‘@’ 意义并不完全相同，‘：’ 的意思就是反参，“@” 符号的意思就是监听事件；Vue框架想要改变父组件的数据，应该依靠子组件的返回值。