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
FOOTBALL_API_KEY=your_api_key_here
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
- 上传截图识别胜平负赔率
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

然后把 `.env` 中的 `FOOTBALL_API_KEY` 改成你自己的 football-data.org API Key。

本地开发和线上部署时，页面都只请求应用自己的 API：

```text
GET /api/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
```

本地由 Vite 代理转发，线上由 Vercel Function 转发。两者都会从服务端环境变量读取 API Key，再请求 football-data.org：

```text
GET https://api.football-data.org/v4/competitions/WC/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
Header: X-Auth-Token: <FOOTBALL_API_KEY>
```

如果没有配置 API Key、网络错误、接口限流或返回格式异常，页面不会崩溃，会提示：

```text
今日赛事数据获取失败，请稍后重试。
```

同时保留本地 mock 数据作为 fallback，方便本地演示和测试。

## 赔率

本项目不抓取中国体育彩票赔率，也不做反爬。V2 支持本地截图识别赔率，识别后必须人工确认。

每场比赛支持手动录入：

- 主胜赔率
- 平局赔率
- 客胜赔率

用户录入后点击「开始分析」，系统会把手动赔率合并进现有评分、稳胆、价值、避坑和串关逻辑。没有赔率的真实比赛可以展示胜负倾向，但不会强行生成明确投注建议，会提示「缺少赔率，暂不建议下注」。

注意：前端不会读取或打包真实 API Key。Vite 本地代理和 Vercel Function 会在服务端读取 `FOOTBALL_API_KEY`。

## 截图识别赔率

V2 增加了「上传赔率截图」入口。用户可以把中国体育彩票、竞彩网、500彩票网、足彩网等页面中的竞彩足球胜平负赔率截图上传到工具中。

使用方式：

1. 打开首页。
2. 点击「上传赔率截图」。
3. 选择 PNG、JPG 或 JPEG 图片。
4. 系统会在本地浏览器中尝试 OCR 识别。
5. 识别结果会进入「赔率识别预览」表格。
6. 人工核对并修改主队、客队、主胜、平局、客胜赔率。
7. 如果系统没有自动匹配到今日比赛，手动选择对应比赛。
8. 点击「应用到今日比赛」。
9. 再点击「开始分析」。

隐私说明：

- 截图不上传到本项目服务器。
- 截图不上传到付费 OCR API。
- OCR 使用 `tesseract.js` 在浏览器端尝试识别。
- 识别结果必须人工核对，页面会提示「赔率来自截图识别，请人工核对」。

限制：

- 第一版优先识别普通胜平负：主胜、平局、客胜。
- 截图表格复杂、图片模糊、队名缩写过多时，OCR 可能识别失败。
- 识别失败不会影响原来的手动录入功能。
- 不做中国体彩网或第三方彩票网站自动爬取，不做自动下注，不做自动出票。
