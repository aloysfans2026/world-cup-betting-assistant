# Vercel 部署指南

目标：通过 GitHub + Vercel 免费部署「世界杯竞彩决策助手」，让朋友可以用公开网址访问。

## 第一步：创建 GitHub 仓库

1. 打开 GitHub。
2. 点击 New repository。
3. 仓库名建议使用：

```text
world-cup-betting-assistant
```

4. 仓库可选 Public 或 Private。Vercel 免费方案都可以导入。
5. 不要在 GitHub 页面勾选自动生成 README、.gitignore 或 License，避免和本地项目冲突。

## 第二步：推送代码

如果本地还没有 GitHub remote：

```bash
git remote add origin https://github.com/<你的GitHub用户名>/world-cup-betting-assistant.git
git push -u origin world-cup-betting-assistant-mvp
```

如果希望 GitHub 主分支叫 `main`，可以先切到目标分支后再推送：

```bash
git push -u origin world-cup-betting-assistant-mvp:main
```

注意：不要提交 `.env`。当前项目已经在 `.gitignore` 中忽略 `.env`。

## 第三步：登录 Vercel

1. 打开 [https://vercel.com](https://vercel.com)。
2. 使用 GitHub 账号登录。

## 第四步：Import Git Repository

1. 在 Vercel 点击 Add New Project。
2. 选择刚刚创建的 GitHub 仓库。
3. Framework Preset 选择 Vite，通常 Vercel 会自动识别。
4. Build Command 使用：

```bash
npm run build
```

5. Output Directory 使用：

```text
dist
```

## 第五步：配置环境变量

在 Vercel 项目的 Environment Variables 中新增：

```text
FOOTBALL_API_KEY=xxxx
```

这里的 `xxxx` 是 football-data.org 的真实 API Key。

不要使用 `VITE_FOOTBALL_API_KEY` 作为线上变量名，因为 `VITE_` 前缀变量属于前端可读变量。线上只使用 `FOOTBALL_API_KEY`。

## 第六步：点击 Deploy

确认配置后点击 Deploy。

部署完成后，Vercel 会生成公开访问地址，格式类似：

```text
https://world-cup-betting-assistant.vercel.app
```

实际地址以 Vercel 页面显示为准。

## 第七步：验证

打开 Vercel 生成的网址，检查：

- 今日比赛正常显示。
- 如果今日没有世界杯比赛，显示「今日暂无世界杯比赛。」。
- 点击「自动获取赔率」后，页面显示赔率更新状态。
- 如果赔率获取失败，显示「今日赔率获取失败，请稍后重试。」。
- 点击「开始分析」。
- 稳胆、价值、避坑、串关模块正常显示。

## 以后如何更新

以后修改代码后执行：

```bash
git add .
git commit -m "描述本次修改"
git push
```

只要代码推送到已绑定的 GitHub 分支，Vercel 会自动重新部署。

## 数据流

线上数据流如下：

```text
浏览器
  -> /api/matches
  -> Vercel Serverless Function
  -> football-data.org
```

API Key 只存在于 Vercel 的 `FOOTBALL_API_KEY` 环境变量中，不会暴露给浏览器。
