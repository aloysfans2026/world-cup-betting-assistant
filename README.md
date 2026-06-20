# 世界杯竞彩决策助手（MVP）

本项目是一个本地网页 App，帮助完全不懂足球的用户快速查看今日世界杯比赛、推荐方向、串关方案和风险提示。

它是竞彩辅助决策工具，不是预测神器，不保证命中，不自动下注，不自动出票。

## 启动

```bash
npm install
npm run dev
```

打开终端显示的本地地址，例如 `http://localhost:5173/`。

## 验证

```bash
npm test
npm run build
```

## MVP 范围

- 今日比赛列表
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

第一版使用本地示例数据，数据服务位于 `src/services/matchService.ts`。未来接入 API-Football 或 Football Data API 时，应保持 UI 继续通过服务层读取数据。
