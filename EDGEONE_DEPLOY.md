# EdgeOne Pages 国内部署指南

目标：在保留 GitHub 和 Vercel 的同时，新增腾讯云 EdgeOne Pages 国内部署。以后只需要推送一次 GitHub，Vercel 和 EdgeOne 都会自动部署。

## 当前项目配置

- 框架：Vite + React + TypeScript
- 构建命令：`npm run build`
- 输出目录：`dist`
- EdgeOne 配置文件：`edgeone.json`
- EdgeOne API 函数目录：`cloud-functions`
- 环境变量：`FOOTBALL_API_KEY`

## 第一步：进入 EdgeOne Pages

1. 打开腾讯云控制台。
2. 在顶部搜索框输入 `EdgeOne`。
3. 进入「EdgeOne」。
4. 在左侧菜单找到「Pages」或「Makers」。
5. 点击进入项目列表页。

> 如果页面显示的是「Makers」而不是「Pages」，这是同一个部署产品的新名称。

## 第二步：创建项目

1. 点击「新建项目」或「创建项目」。
2. 选择「从 Git 仓库导入」。
3. 选择 GitHub。
4. 如果是第一次使用，按页面提示授权腾讯云访问 GitHub。
5. 授权完成后，在仓库列表里选择：

```text
world-cup-betting-assistant
```

如果你的 GitHub 仓库名称不同，就选择当前项目所在的那个仓库。

## 第三步：填写构建配置

在项目配置页面填写：

```text
框架类型：Vite
安装命令：npm install
构建命令：npm run build
输出目录：dist
根目录：/
Node.js 版本：20
```

如果页面没有「框架类型」选项，保持默认即可；关键是构建命令和输出目录必须正确。

## 第四步：配置环境变量

在「环境变量」区域新增：

```text
变量名：FOOTBALL_API_KEY
变量值：你的 football-data.org API Key
```

注意：

- 不要填写 `VITE_FOOTBALL_API_KEY`。
- 不要把 API Key 写进代码。
- 不要把 `.env` 上传到 GitHub。

## 第五步：开始首次部署

1. 确认配置无误。
2. 点击「部署」或「保存并部署」。
3. 等待构建完成。
4. 部署成功后，EdgeOne 会生成一个国内访问地址。

## 第六步：部署后验证

打开 EdgeOne 生成的网址，逐项检查：

- 首页可以打开。
- 所有球队名称显示中文。
- 国旗正常显示。
- 默认选中今天的日期。
- 日期 Tab 可以左右切换。
- 今日比赛按时间排序。
- 点击「自动获取赔率」后，赔率可以填充。
- 点击「开始分析」后，稳胆、价值推荐、避坑和推荐串关正常显示。

再直接访问下面两个接口，确认 API 函数正常：

```text
https://你的-edgeone-域名/api/matches?dateFrom=2026-06-27&dateTo=2026-06-27
https://你的-edgeone-域名/api/odds?date=2026-06-27
```

如果接口返回 JSON，说明 EdgeOne Functions 已经正常工作。

## 以后如何更新

以后只需要在本地完成修改后推送 GitHub：

```bash
git add .
git commit -m "描述本次修改"
git push
```

自动流程是：

```text
git push
  -> GitHub
  -> Vercel 自动部署
  -> EdgeOne Pages 自动部署
```

不需要手动上传文件，也不需要重新创建项目。

## 常见问题

### 首页能打开，但接口失败

检查 EdgeOne 项目里是否已经配置：

```text
FOOTBALL_API_KEY
```

然后重新部署一次。

### 首页刷新后变成 404

当前项目没有复杂子路由；同时 `public/404.html` 已经做了轻量兜底，会自动回到首页。如果未来新增子路由，再根据 EdgeOne 当时支持的路由规则补充更完整的 SPA 回退配置。

### Vercel 和 EdgeOne 数据不一致

两个平台都请求同一套公开数据源，但缓存时间和不同节点的请求时刻可能不完全一致。通常等待 1 到 3 分钟后刷新即可。

### 自动赔率不完整

这通常是公开数据源当场比赛没有提供完整胜平负赔率。系统不会补造赔率，也不会使用登录、Cookie、验证码或模拟下注方式获取数据。
