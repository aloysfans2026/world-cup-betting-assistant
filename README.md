# 世界杯竞彩决策助手

一个面向中国用户的世界杯竞彩辅助决策工具。页面自动加载今日世界杯比赛，自动获取竞彩足球胜平负赔率，帮助用户快速查看稳胆、价值推荐、避坑比赛和推荐串关。

本项目只做辅助分析，不保证命中，不自动下注，不自动出票。

## 使用流程

1. 打开首页，系统自动加载今日世界杯比赛。
2. 点击「自动获取赔率」。
3. 点击「开始分析」。
4. 查看稳胆、价值推荐、避坑比赛和推荐串关。

如果今天没有世界杯比赛，页面显示：

```text
今日暂无世界杯比赛。
```

如果赔率获取失败，页面显示：

```text
今日赔率获取失败，请稍后重试。
```

## 数据

比赛数据通过应用服务端获取。赔率优先使用中国竞彩网公开数据，失败时使用公开备用数据源。前端只请求应用自己的服务端接口，不需要用户提供账号、密码、Cookie 或 API Key。

赔率接口可能因公开页面结构调整而变动；页面会保留已有比赛展示，并提示稍后重试。

## 本地运行

```bash
npm install
cp .env.example .env
npm run dev
```

如需加载真实世界杯赛程/赛果，请在 `.env` 中配置：

```bash
FOOTBALL_API_KEY=your_api_key_here
```

## 部署

项目同时兼容 Vercel 和腾讯云 EdgeOne Pages：

- Vercel：使用 `api/matches.js` 和 `api/odds.js`。
- EdgeOne Pages：使用 `cloud-functions/api/matches/index.js` 和 `cloud-functions/api/odds/index.js`。
- 两个平台共用同一套服务端业务处理逻辑，前端仍然只请求 `/api/matches` 和 `/api/odds`。

构建命令统一为：

```bash
npm run build
```

输出目录统一为：

```text
dist
```

线上环境变量统一配置：

```text
FOOTBALL_API_KEY
```

EdgeOne Pages 的首次配置步骤见 [EDGEONE_DEPLOY.md](EDGEONE_DEPLOY.md)。

## 验证

```bash
npm test
npm run build
```
