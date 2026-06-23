# 世界杯竞彩决策助手（MVP）

本项目是一个本地网页 App，帮助完全不懂足球的用户快速查看今日世界杯比赛、推荐方向、串关方案和风险提示。

它是竞彩辅助决策工具，不是预测神器，不保证命中，不自动下注，不自动出票。

## 启动

```bash
npm install
cp .env.example .env
npm run dev
```

打开终端显示的本地地址，例如 `http://localhost:5173/`。

如果要加载真实世界杯赛程/赛果，请在 `.env` 中填入：

```bash
VITE_FOOTBALL_API_KEY=your_api_key_here
```

## 验证

```bash
npm test
npm run build
```

## MVP 范围

- 今日比赛列表
- football-data.org 今日世界杯赛程/比分/状态
- 手动录入主胜/平局/客胜赔率
- 开始分析
- 今日稳胆 TOP3
- 今日价值投注 TOP3
- 今日避坑比赛
- 推荐串关方案
- 比赛详情
- 评分拆解
- AI 风格解释文案
- 风险提示与免责声明

## 数据

第一版选择 [football-data.org v4](https://www.football-data.org/documentation/quickstart) 作为世界杯赛程/赛果接口。

选择原因：

- 提供世界杯 `WC` 赛事的比赛列表、开赛时间、状态和比分。
- REST 接口简单，前端 MVP 容易接入。
- 免费账号可申请 API Key，适合先验证产品流程。

需要 API Key。配置方式：

```bash
cp .env.example .env
```

然后把 `.env` 中的 `VITE_FOOTBALL_API_KEY` 改成你自己的 football-data.org API Key。

本地开发模式下，页面会先请求 Vite 本地代理：

```text
GET /football-data/v4/competitions/WC/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
```

Vite 代理再把请求转发到 football-data.org，并从 `.env` 读取 API Key 后加上请求头：

```text
GET https://api.football-data.org/v4/competitions/WC/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
Header: X-Auth-Token: <VITE_FOOTBALL_API_KEY>
```

如果没有配置 API Key、网络错误、接口限流或返回格式异常，页面不会崩溃，会提示：

```text
今日赛事数据获取失败，请稍后重试。
```

同时保留本地 mock 数据作为 fallback，方便本地演示和测试。

## 赔率

V1 不抓取中国体育彩票赔率，也不做反爬或 OCR。

每场比赛支持手动录入：

- 主胜赔率
- 平局赔率
- 客胜赔率

用户录入后点击「开始分析」，系统会把手动赔率合并进现有评分、稳胆、价值、避坑和串关逻辑。没有赔率的真实比赛可以展示胜负倾向，但不会强行生成明确投注建议，会提示「缺少赔率，暂不建议下注」。

注意：当前本地开发已通过 Vite 代理减少浏览器端直连问题。这个方案适合本地 MVP；如果后续上线给多人使用，应改成正式后端代理保存 API Key。
