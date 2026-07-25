#!/usr/bin/env node
'use strict';

// 扫描 _posts/*.md 的 front matter，提取 categories，生成 categories.json
// 分类顺序按"首次出现"稳定排列（先按文件名排序遍历文章）。

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, '_posts');
const OUT = path.join(ROOT, 'categories.json');

// 从单篇文档中提取分类（支持 categories: [a, b] 与 categories: 日记 两种写法）
function extractCats(text) {
  const fm = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return [];
  const block = fm[1];

  const bracket = block.match(/^categories?:\s*\[([^\]]*)\]/m);
  if (bracket) {
    return bracket[1]
      .split(',')
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }

  const single = block.match(/^categories?:\s*(.+)$/m);
  if (single) {
    return [single[1].trim().replace(/^["']|["']$/g, '')].filter(Boolean);
  }
  return [];
}

const ordered = [];
const names = fs.readdirSync(POSTS_DIR).filter(n => n.endsWith('.md')).sort();

for (const name of names) {
  const text = fs.readFileSync(path.join(POSTS_DIR, name), 'utf8');
  for (const cat of extractCats(text)) {
    if (!ordered.includes(cat)) ordered.push(cat);
  }
}

const out = JSON.stringify({ categories: ordered }, null, 2) + '\n';
fs.writeFileSync(OUT, out);
console.log('categories.json ->', ordered.join(', ') || '(empty)');
