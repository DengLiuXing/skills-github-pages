---
layout: page
title: 文章分类
permalink: /categories/
---

{% assign sorted_cats = site.categories | sort %}
{% for cat_entry in sorted_cats %}
  {% assign cat_name = cat_entry[0] %}
  {% assign cat_posts = cat_entry[1] %}

<div class="category-group" style="margin-bottom:2.5em">
  <h2 id="{{ cat_name | slugify }}" style="margin-bottom:.6em">
    {{ cat_name }}
  </h2>

  <ul style="list-style:none;padding-left:0">
    {% for post in cat_posts %}
    <li style="margin-bottom:.4em">
      <time datetime="{{ post.date | date_to_xmlschema }}" style="color:var(--muted,#8b93a7);font-size:.85em;margin-right:.8em">
        {{ post.date | date: "%Y-%m-%d" }}
      </time>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
    {% endfor %}
  </ul>
</div>

{% endfor %}

{% assign cat_count = site.categories | size %}
{% if cat_count == 0 %}
<p style="color:var(--muted)">还没有文章分类。</p>
{% endif %}
