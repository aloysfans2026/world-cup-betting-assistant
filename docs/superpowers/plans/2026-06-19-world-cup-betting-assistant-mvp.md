# World Cup Betting Assistant MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Vite + React + TypeScript MVP for “世界杯竞彩决策助手” that shows today’s World Cup matches, generates rule-based recommendations, explains risks, and helps a football novice decide whether to participate.

**Architecture:** The app uses static fixture data through a service boundary, pure domain modules for scoring and recommendations, template-based explanation generation, and a React dashboard UI. AI is represented by explanation templates only; all recommendation decisions come from deterministic scoring functions.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS modules through a single global stylesheet.

---

## File Structure

Create these files:

- `package.json`: npm scripts and dependencies.
- `index.html`: Vite HTML entry point.
- `tsconfig.json`: TypeScript project settings.
- `tsconfig.node.json`: TypeScript settings for Vite config.
- `vite.config.ts`: Vite + React + Vitest configuration.
- `src/main.tsx`: React entry point.
- `src/App.tsx`: Main app state and page composition.
- `src/styles.css`: Global responsive UI styles.
- `src/test/setup.ts`: Vitest DOM matcher setup.
- `src/domain/types.ts`: Shared domain types.
- `src/domain/scoring.ts`: Pure scoring functions.
- `src/domain/scoring.test.ts`: Scoring tests.
- `src/domain/recommendations.ts`: Pure recommendation and parlay generation.
- `src/domain/recommendations.test.ts`: Recommendation tests.
- `src/domain/explanations.ts`: Template-based explanation generation.
- `src/domain/explanations.test.ts`: Explanation tests.
- `src/fixtures/worldCupMatches.ts`: Structured sample World Cup match data.
- `src/services/matchService.ts`: Data service boundary for fixtures now and real APIs in a future version.
- `src/services/matchService.test.ts`: Service boundary tests.
- `src/components/Dashboard.tsx`: Top-level dashboard view.
- `src/components/MatchList.tsx`: Today’s match list.
- `src/components/RecommendationSection.tsx`: Stable/value/trap recommendation sections.
- `src/components/ParlayPlans.tsx`: Conservative/balanced/high-upside parlay cards.
- `src/components/MatchDetailModal.tsx`: Match detail overlay.
- `src/components/Disclaimer.tsx`: Persistent risk disclaimer.
- `src/App.test.tsx`: User-flow tests.

The first implementation should keep all data local and deterministic. The service layer must make the fixture source look like an API source so the UI does not depend on fixture internals.

---

## Task 1: Project Scaffold And Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/test/setup.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json` with this content:

```json
{
  "name": "world-cup-betting-assistant",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "jsdom": "^26.0.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Create the Vite HTML entry**

Create `index.html` with this content:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>世界杯竞彩决策助手</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Add TypeScript configuration**

Create `tsconfig.json` with this content:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json` with this content:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Add Vite and Vitest configuration**

Create `vite.config.ts` with this content:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 5: Add test setup**

Create `src/test/setup.ts` with this content:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 6: Update ignored files**

Ensure `.gitignore` contains these lines:

```gitignore
.superpowers/
node_modules/
dist/
coverage/
.DS_Store
```

- [ ] **Step 7: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules/` and `package-lock.json` are created. If network access is blocked, rerun with approval because dependency download is required.

- [ ] **Step 8: Verify installed toolchain commands**

Run:

```bash
npm exec vite -- --version
npm exec vitest -- --version
```

Expected: both commands print version numbers. Full app build verification starts after the React entry files exist.

- [ ] **Step 9: Commit the scaffold**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src/test/setup.ts .gitignore
git commit -m "chore: scaffold frontend app"
```

---

## Task 2: Domain Types, Fixture Data, And Service Boundary

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/fixtures/worldCupMatches.ts`
- Create: `src/services/matchService.ts`
- Create: `src/services/matchService.test.ts`

- [ ] **Step 1: Write service boundary tests first**

Create `src/services/matchService.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import { getTodayMatches } from "./matchService";

describe("matchService", () => {
  it("returns six sample World Cup matches with team and odds data", async () => {
    const matches = await getTodayMatches();

    expect(matches).toHaveLength(6);
    expect(matches[0]).toMatchObject({
      id: "canada-morocco",
      homeTeam: { name: "加拿大" },
      awayTeam: { name: "摩洛哥" },
    });
    expect(matches.every((match) => match.homeTeam.fifaRank > 0)).toBe(true);
    expect(matches.every((match) => match.awayTeam.fifaRank > 0)).toBe(true);
    expect(matches.some((match) => match.odds?.homeWin)).toBe(true);
  });

  it("keeps fixture data behind an async API-shaped function", async () => {
    const matches = await getTodayMatches();

    expect(Array.isArray(matches)).toBe(true);
    expect(matches[0].recentHeadToHead).toEqual(expect.any(Array));
  });
});
```

- [ ] **Step 2: Run the failing service test**

Run:

```bash
npm test -- src/services/matchService.test.ts
```

Expected: FAIL because `src/services/matchService.ts` does not exist yet.

- [ ] **Step 3: Create domain types**

Create `src/domain/types.ts` with this content:

```ts
export type RiskLevel = "低" | "中" | "高";

export type MatchResult = "胜" | "平" | "负";

export type BetDirection =
  | "主胜"
  | "平"
  | "客胜"
  | "让胜"
  | "让平"
  | "让负";

export type RecommendationKind = "稳胆" | "价值" | "避坑";

export interface TeamFormMatch {
  opponent: string;
  result: MatchResult;
  goalsFor: number;
  goalsAgainst: number;
}

export interface Team {
  id: string;
  name: string;
  fifaRank: number;
  recentForm: TeamFormMatch[];
}

export interface Odds {
  homeWin: number;
  draw: number;
  awayWin: number;
  handicap?: string;
  recommendedDirection: BetDirection;
  recommendedOdds: number;
  marketMovement: "稳定" | "升温" | "异常";
}

export interface HeadToHeadMatch {
  label: string;
  homeGoals: number;
  awayGoals: number;
}

export interface Match {
  id: string;
  kickoffTime: string;
  homeTeam: Team;
  awayTeam: Team;
  odds?: Odds;
  recentHeadToHead: HeadToHeadMatch[];
  notes: string[];
}

export interface ScoreBreakdown {
  strength: number;
  form: number;
  attack: number;
  defense: number;
  headToHead: number;
  market: number;
}

export interface MatchScore {
  matchId: string;
  direction: BetDirection;
  total: number;
  confidence: number;
  modelProbability: number;
  impliedProbability: number;
  risk: RiskLevel;
  breakdown: ScoreBreakdown;
  reasons: string[];
  warnings: string[];
  dataCompleteness: number;
}

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  match: Match;
  score: MatchScore;
  title: string;
  reason: string;
}

export interface ParlayPlan {
  id: "conservative" | "balanced" | "upside";
  label: "保守方案" | "平衡方案" | "冲高方案";
  type: "2串1" | "3串1" | "4串1";
  sampleStake: number;
  risk: RiskLevel;
  picks: Recommendation[];
}

export interface AnalysisResult {
  safePicks: Recommendation[];
  valuePicks: Recommendation[];
  trapMatches: Recommendation[];
  parlayPlans: ParlayPlan[];
  summary: string;
}
```

- [ ] **Step 4: Create sample match fixtures**

Create `src/fixtures/worldCupMatches.ts` with fixture data that includes exactly six matches. Use this structure and include all six objects:

```ts
import type { Match } from "../domain/types";

const form = {
  strong: [
    { opponent: "美国", result: "胜", goalsFor: 2, goalsAgainst: 0 },
    { opponent: "日本", result: "胜", goalsFor: 3, goalsAgainst: 1 },
    { opponent: "哥斯达黎加", result: "平", goalsFor: 1, goalsAgainst: 1 },
    { opponent: "韩国", result: "胜", goalsFor: 2, goalsAgainst: 1 },
    { opponent: "丹麦", result: "胜", goalsFor: 1, goalsAgainst: 0 },
  ],
  mixed: [
    { opponent: "喀麦隆", result: "胜", goalsFor: 2, goalsAgainst: 1 },
    { opponent: "塞内加尔", result: "负", goalsFor: 0, goalsAgainst: 1 },
    { opponent: "伊朗", result: "平", goalsFor: 1, goalsAgainst: 1 },
    { opponent: "澳大利亚", result: "胜", goalsFor: 2, goalsAgainst: 0 },
    { opponent: "威尔士", result: "平", goalsFor: 0, goalsAgainst: 0 },
  ],
  weak: [
    { opponent: "巴拉圭", result: "负", goalsFor: 0, goalsAgainst: 2 },
    { opponent: "厄瓜多尔", result: "平", goalsFor: 1, goalsAgainst: 1 },
    { opponent: "突尼斯", result: "负", goalsFor: 0, goalsAgainst: 1 },
    { opponent: "沙特", result: "胜", goalsFor: 1, goalsAgainst: 0 },
    { opponent: "加纳", result: "负", goalsFor: 1, goalsAgainst: 3 },
  ],
} as const;

export const todayMatches: Match[] = [
  {
    id: "canada-morocco",
    kickoffTime: "20:00",
    homeTeam: { id: "canada", name: "加拿大", fifaRank: 28, recentForm: [...form.strong] },
    awayTeam: { id: "morocco", name: "摩洛哥", fifaRank: 36, recentForm: [...form.mixed] },
    odds: {
      homeWin: 2.15,
      draw: 3.05,
      awayWin: 3.35,
      handicap: "加拿大 -0.5",
      recommendedDirection: "让胜",
      recommendedOdds: 1.92,
      marketMovement: "稳定",
    },
    recentHeadToHead: [{ label: "上次交锋", homeGoals: 2, awayGoals: 1 }],
    notes: ["加拿大近期攻防均衡", "盘口变化平稳"],
  },
  {
    id: "switzerland-serbia",
    kickoffTime: "23:00",
    homeTeam: { id: "switzerland", name: "瑞士", fifaRank: 19, recentForm: [...form.strong] },
    awayTeam: { id: "serbia", name: "塞尔维亚", fifaRank: 32, recentForm: [...form.mixed] },
    odds: {
      homeWin: 1.88,
      draw: 3.25,
      awayWin: 4.1,
      handicap: "瑞士 -0.5",
      recommendedDirection: "让胜",
      recommendedOdds: 1.88,
      marketMovement: "稳定",
    },
    recentHeadToHead: [{ label: "上次交锋", homeGoals: 1, awayGoals: 0 }],
    notes: ["瑞士排名优势明显", "塞尔维亚防守波动"],
  },
  {
    id: "mexico-poland",
    kickoffTime: "02:00",
    homeTeam: { id: "mexico", name: "墨西哥", fifaRank: 22, recentForm: [...form.mixed] },
    awayTeam: { id: "poland", name: "波兰", fifaRank: 26, recentForm: [...form.weak] },
    odds: {
      homeWin: 2.75,
      draw: 3.0,
      awayWin: 2.45,
      handicap: "墨西哥 +0.5",
      recommendedDirection: "让负",
      recommendedOdds: 1.95,
      marketMovement: "升温",
    },
    recentHeadToHead: [{ label: "上次交锋", homeGoals: 0, awayGoals: 1 }],
    notes: ["两队实力接近", "让球方向更适合控制风险"],
  },
  {
    id: "brazil-haiti",
    kickoffTime: "03:00",
    homeTeam: { id: "brazil", name: "巴西", fifaRank: 3, recentForm: [...form.strong] },
    awayTeam: { id: "haiti", name: "海地", fifaRank: 89, recentForm: [...form.weak] },
    odds: {
      homeWin: 1.12,
      draw: 7.8,
      awayWin: 18,
      handicap: "巴西 -2.5",
      recommendedDirection: "主胜",
      recommendedOdds: 1.12,
      marketMovement: "稳定",
    },
    recentHeadToHead: [{ label: "上次交锋", homeGoals: 4, awayGoals: 0 }],
    notes: ["实力差距极大", "主胜赔率过低，收益不足"],
  },
  {
    id: "japan-denmark",
    kickoffTime: "18:00",
    homeTeam: { id: "japan", name: "日本", fifaRank: 17, recentForm: [...form.mixed] },
    awayTeam: { id: "denmark", name: "丹麦", fifaRank: 21, recentForm: [...form.mixed] },
    odds: {
      homeWin: 2.35,
      draw: 3.1,
      awayWin: 2.9,
      handicap: "日本 0",
      recommendedDirection: "主胜",
      recommendedOdds: 2.35,
      marketMovement: "升温",
    },
    recentHeadToHead: [],
    notes: ["双方实力接近", "赔率存在一定价值空间"],
  },
  {
    id: "usa-wales",
    kickoffTime: "21:00",
    homeTeam: { id: "usa", name: "美国", fifaRank: 24, recentForm: [...form.mixed] },
    awayTeam: { id: "wales", name: "威尔士", fifaRank: 35, recentForm: [...form.weak] },
    odds: {
      homeWin: 2.05,
      draw: 3.2,
      awayWin: 3.55,
      handicap: "美国 -0.25",
      recommendedDirection: "主胜",
      recommendedOdds: 2.05,
      marketMovement: "稳定",
    },
    recentHeadToHead: [{ label: "上次交锋", homeGoals: 1, awayGoals: 1 }],
    notes: ["美国排名和状态占优", "平局风险仍需留意"],
  },
];
```

- [ ] **Step 5: Create the service boundary**

Create `src/services/matchService.ts` with this content:

```ts
import { todayMatches } from "../fixtures/worldCupMatches";
import type { Match } from "../domain/types";

export async function getTodayMatches(): Promise<Match[]> {
  return todayMatches;
}
```

- [ ] **Step 6: Verify service tests pass**

Run:

```bash
npm test -- src/services/matchService.test.ts
```

Expected: PASS with 2 tests.

- [ ] **Step 7: Commit domain data foundation**

```bash
git add src/domain/types.ts src/fixtures/worldCupMatches.ts src/services/matchService.ts src/services/matchService.test.ts
git commit -m "feat: add sample match data service"
```

---

## Task 3: Rule-Based Scoring Module

**Files:**
- Create: `src/domain/scoring.ts`
- Create: `src/domain/scoring.test.ts`

- [ ] **Step 1: Write scoring tests**

Create `src/domain/scoring.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { calculateMatchScore, impliedProbability } from "./scoring";

describe("scoring", () => {
  it("converts decimal odds to implied probability", () => {
    expect(impliedProbability(2)).toBe(50);
    expect(impliedProbability(1.25)).toBe(80);
  });

  it("scores Canada vs Morocco as a low-risk high-confidence pick", () => {
    const match = todayMatches.find((item) => item.id === "canada-morocco");
    if (!match) throw new Error("Fixture missing");

    const score = calculateMatchScore(match);

    expect(score.direction).toBe("让胜");
    expect(score.total).toBeGreaterThanOrEqual(85);
    expect(score.confidence).toBeGreaterThanOrEqual(85);
    expect(score.risk).toBe("低");
    expect(score.breakdown.strength).toBeGreaterThan(20);
    expect(score.reasons).toContain("球队实力和近期状态都支持该方向");
  });

  it("flags Brazil vs Haiti as high-risk despite a likely outcome", () => {
    const match = todayMatches.find((item) => item.id === "brazil-haiti");
    if (!match) throw new Error("Fixture missing");

    const score = calculateMatchScore(match);

    expect(score.total).toBeGreaterThanOrEqual(80);
    expect(score.risk).toBe("高");
    expect(score.warnings).toContain("赔率过低，收益不足");
  });

  it("reduces data completeness when head-to-head data is absent", () => {
    const match = todayMatches.find((item) => item.id === "japan-denmark");
    if (!match) throw new Error("Fixture missing");

    const score = calculateMatchScore(match);

    expect(score.dataCompleteness).toBe(90);
    expect(score.warnings).toContain("历史交锋数据缺失");
  });
});
```

- [ ] **Step 2: Run the failing scoring test**

Run:

```bash
npm test -- src/domain/scoring.test.ts
```

Expected: FAIL because `src/domain/scoring.ts` does not exist yet.

- [ ] **Step 3: Implement deterministic scoring**

Create `src/domain/scoring.ts` with this content:

```ts
import type { Match, MatchScore, RiskLevel, Team, TeamFormMatch } from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function impliedProbability(decimalOdds: number): number {
  return Math.round((1 / decimalOdds) * 100);
}

function winPoints(result: TeamFormMatch["result"]): number {
  if (result === "胜") return 3;
  if (result === "平") return 1;
  return 0;
}

function formPoints(team: Team): number {
  const raw = team.recentForm.reduce((sum, match) => sum + winPoints(match.result), 0);
  return clamp((raw / 15) * 100);
}

function goalsFor(team: Team): number {
  return team.recentForm.reduce((sum, match) => sum + match.goalsFor, 0);
}

function goalsAgainst(team: Team): number {
  return team.recentForm.reduce((sum, match) => sum + match.goalsAgainst, 0);
}

function rankStrength(homeRank: number, awayRank: number): number {
  const gap = awayRank - homeRank;
  return clamp(50 + gap * 1.2);
}

function attackScore(home: Team, away: Team): number {
  return clamp(50 + (goalsFor(home) - goalsFor(away)) * 6);
}

function defenseScore(home: Team, away: Team): number {
  return clamp(50 + (goalsAgainst(away) - goalsAgainst(home)) * 6);
}

function headToHeadScore(match: Match): number {
  if (match.recentHeadToHead.length === 0) return 50;

  const goalDiff = match.recentHeadToHead.reduce(
    (sum, item) => sum + item.homeGoals - item.awayGoals,
    0,
  );
  return clamp(50 + goalDiff * 10);
}

function marketScore(match: Match): number {
  if (!match.odds) return 45;

  const implied = impliedProbability(match.odds.recommendedOdds);
  const movementBonus = match.odds.marketMovement === "稳定" ? 8 : match.odds.marketMovement === "升温" ? 4 : -10;
  const valueBonus = match.odds.recommendedOdds >= 1.8 && match.odds.recommendedOdds <= 2.6 ? 12 : -8;
  return clamp(50 + movementBonus + valueBonus - Math.max(0, implied - 65));
}

function riskFor(match: Match, total: number): RiskLevel {
  if (!match.odds) return "高";
  if (match.odds.recommendedOdds < 1.2 || match.odds.marketMovement === "异常") return "高";
  if (match.recentHeadToHead.length === 0 || total < 82) return "中";
  return "低";
}

export function calculateMatchScore(match: Match): MatchScore {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const strengthRaw = rankStrength(home.fifaRank, away.fifaRank);
  const formRaw = clamp(50 + (formPoints(home) - formPoints(away)) * 0.7);
  const attackRaw = attackScore(home, away);
  const defenseRaw = defenseScore(home, away);
  const headToHeadRaw = headToHeadScore(match);
  const marketRaw = marketScore(match);

  const breakdown = {
    strength: Math.round(strengthRaw * 0.3),
    form: Math.round(formRaw * 0.25),
    attack: Math.round(attackRaw * 0.15),
    defense: Math.round(defenseRaw * 0.15),
    headToHead: Math.round(headToHeadRaw * 0.05),
    market: Math.round(marketRaw * 0.1),
  };

  const weightedScore = clamp(
    breakdown.strength +
      breakdown.form +
      breakdown.attack +
      breakdown.defense +
      breakdown.headToHead +
      breakdown.market,
  );
  const total = clamp(Math.round((weightedScore / 75) * 100));
  const odds = match.odds;
  const implied = odds ? impliedProbability(odds.recommendedOdds) : 0;
  const modelProbability = clamp(Math.round(total * 0.78 + 18));
  const risk = riskFor(match, total);
  const warnings: string[] = [];
  const reasons: string[] = [];

  if (strengthRaw >= 60 && formRaw >= 60) {
    reasons.push("球队实力和近期状态都支持该方向");
  }
  if (attackRaw >= 55) reasons.push("近期进攻表现更稳定");
  if (defenseRaw >= 55) reasons.push("防守端失球控制更好");
  if (!odds) warnings.push("盘口数据缺失");
  if (odds && odds.recommendedOdds < 1.2) warnings.push("赔率过低，收益不足");
  if (match.recentHeadToHead.length === 0) warnings.push("历史交锋数据缺失");
  if (odds?.marketMovement === "异常") warnings.push("盘口变化异常");

  return {
    matchId: match.id,
    direction: odds?.recommendedDirection ?? "主胜",
    total: Math.round(total),
    confidence: Math.round(clamp(total - (risk === "高" ? 8 : risk === "中" ? 4 : 0))),
    modelProbability,
    impliedProbability: implied,
    risk,
    breakdown,
    reasons,
    warnings,
    dataCompleteness: match.recentHeadToHead.length === 0 ? 90 : odds ? 100 : 80,
  };
}
```

- [ ] **Step 4: Verify scoring tests pass**

Run:

```bash
npm test -- src/domain/scoring.test.ts
```

Expected: PASS with 4 tests.

- [ ] **Step 5: Commit scoring**

```bash
git add src/domain/scoring.ts src/domain/scoring.test.ts
git commit -m "feat: add rule based scoring"
```

---

## Task 4: Recommendation And Parlay Generation

**Files:**
- Create: `src/domain/recommendations.ts`
- Create: `src/domain/recommendations.test.ts`

- [ ] **Step 1: Write recommendation tests**

Create `src/domain/recommendations.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { buildAnalysis } from "./recommendations";

describe("recommendations", () => {
  it("builds stable, value, trap, and parlay sections", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.safePicks).toHaveLength(3);
    expect(analysis.valuePicks).toHaveLength(3);
    expect(analysis.trapMatches.length).toBeGreaterThanOrEqual(1);
    expect(analysis.parlayPlans).toHaveLength(3);
  });

  it("puts low-risk high-confidence picks first in the safe list", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.safePicks[0].score.risk).toBe("低");
    expect(analysis.safePicks[0].score.confidence).toBeGreaterThanOrEqual(
      analysis.safePicks[1].score.confidence,
    );
    expect(analysis.safePicks.some((item) => item.title.includes("加拿大"))).toBe(true);
  });

  it("flags Brazil vs Haiti as a trap match", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.trapMatches.some((item) => item.match.id === "brazil-haiti")).toBe(true);
  });

  it("uses fixed sample stakes for three parlay plans", () => {
    const analysis = buildAnalysis(todayMatches);

    expect(analysis.parlayPlans.map((plan) => plan.sampleStake)).toEqual([20, 20, 10]);
    expect(analysis.parlayPlans.map((plan) => plan.type)).toEqual(["2串1", "3串1", "4串1"]);
  });
});
```

- [ ] **Step 2: Run the failing recommendation test**

Run:

```bash
npm test -- src/domain/recommendations.test.ts
```

Expected: FAIL because `src/domain/recommendations.ts` does not exist yet.

- [ ] **Step 3: Implement recommendation generation**

Create `src/domain/recommendations.ts` with this content:

```ts
import { calculateMatchScore } from "./scoring";
import type { AnalysisResult, Match, ParlayPlan, Recommendation, RiskLevel } from "./types";

function recommendationTitle(match: Match, direction: string): string {
  return `${match.homeTeam.name}${direction}`;
}

function riskRank(risk: RiskLevel): number {
  if (risk === "低") return 0;
  if (risk === "中") return 1;
  return 2;
}

function createRecommendation(match: Match, kind: Recommendation["kind"]): Recommendation {
  const score = calculateMatchScore(match);
  return {
    id: `${kind}-${match.id}`,
    kind,
    match,
    score,
    title: recommendationTitle(match, score.direction),
    reason:
      kind === "避坑"
        ? "收益和风险不匹配，适合跳过或只观察。"
        : "综合分、近期状态和盘口位置支持进入今日候选。",
  };
}

function bySafeScore(a: Recommendation, b: Recommendation): number {
  return riskRank(a.score.risk) - riskRank(b.score.risk) || b.score.confidence - a.score.confidence;
}

function byValueScore(a: Recommendation, b: Recommendation): number {
  const aValue = a.score.modelProbability - a.score.impliedProbability;
  const bValue = b.score.modelProbability - b.score.impliedProbability;
  return bValue - aValue || b.score.confidence - a.score.confidence;
}

function buildParlays(safe: Recommendation[], value: Recommendation[]): ParlayPlan[] {
  const pool = [...safe, ...value].filter(
    (item, index, all) => all.findIndex((candidate) => candidate.match.id === item.match.id) === index,
  );

  return [
    {
      id: "conservative",
      label: "保守方案",
      type: "2串1",
      sampleStake: 20,
      risk: "低",
      picks: pool.slice(0, 2),
    },
    {
      id: "balanced",
      label: "平衡方案",
      type: "3串1",
      sampleStake: 20,
      risk: "中",
      picks: pool.slice(0, 3),
    },
    {
      id: "upside",
      label: "冲高方案",
      type: "4串1",
      sampleStake: 10,
      risk: "高",
      picks: pool.slice(0, 4),
    },
  ];
}

export function buildAnalysis(matches: Match[]): AnalysisResult {
  const scored = matches.map((match) => createRecommendation(match, "稳胆"));
  const traps = scored
    .filter(
      (item) =>
        item.score.risk === "高" ||
        item.score.warnings.includes("赔率过低，收益不足") ||
        item.score.warnings.includes("盘口变化异常"),
    )
    .map((item) => ({ ...item, id: `避坑-${item.match.id}`, kind: "避坑" as const }));

  const safePicks = scored
    .filter((item) => item.score.risk !== "高")
    .sort(bySafeScore)
    .slice(0, 3);

  const valuePicks = scored
    .filter((item) => item.score.risk !== "高")
    .map((item) => ({ ...item, id: `价值-${item.match.id}`, kind: "价值" as const }))
    .sort(byValueScore)
    .slice(0, 3);

  return {
    safePicks,
    valuePicks,
    trapMatches: traps,
    parlayPlans: buildParlays(safePicks, valuePicks),
    summary: traps.length > 0 ? "建议小额参与，避开超低赔率场。" : "今日可以关注低风险组合，仍需控制投入。",
  };
}
```

- [ ] **Step 4: Verify recommendation tests pass**

Run:

```bash
npm test -- src/domain/recommendations.test.ts
```

Expected: PASS with 4 tests.

- [ ] **Step 5: Commit recommendations**

```bash
git add src/domain/recommendations.ts src/domain/recommendations.test.ts
git commit -m "feat: generate betting recommendations"
```

---

## Task 5: Explanation Templates

**Files:**
- Create: `src/domain/explanations.ts`
- Create: `src/domain/explanations.test.ts`

- [ ] **Step 1: Write explanation tests**

Create `src/domain/explanations.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import { todayMatches } from "../fixtures/worldCupMatches";
import { buildAnalysis } from "./recommendations";
import { explainRecommendation } from "./explanations";

describe("explanations", () => {
  it("explains a stable recommendation in novice-friendly language", () => {
    const analysis = buildAnalysis(todayMatches);
    const text = explainRecommendation(analysis.safePicks[0]);

    expect(text).toContain("为什么推荐");
    expect(text).toContain("风险在哪里");
    expect(text).toContain("不保证命中");
  });

  it("explains trap matches as low return or high risk", () => {
    const analysis = buildAnalysis(todayMatches);
    const trap = analysis.trapMatches.find((item) => item.match.id === "brazil-haiti");
    if (!trap) throw new Error("Trap fixture missing");

    const text = explainRecommendation(trap);

    expect(text).toContain("为什么不推荐");
    expect(text).toContain("赔率过低");
  });
});
```

- [ ] **Step 2: Run the failing explanation test**

Run:

```bash
npm test -- src/domain/explanations.test.ts
```

Expected: FAIL because `src/domain/explanations.ts` does not exist yet.

- [ ] **Step 3: Implement explanation templates**

Create `src/domain/explanations.ts` with this content:

```ts
import type { Recommendation } from "./types";

export function explainRecommendation(recommendation: Recommendation): string {
  const { match, score, kind, title } = recommendation;
  const warnings = score.warnings.length > 0 ? score.warnings.join("、") : "仍然存在比赛临场变化风险";
  const reasons = score.reasons.length > 0 ? score.reasons.join("、") : "综合评分支持该方向";

  if (kind === "避坑") {
    return `为什么不推荐：${match.homeTeam.name} VS ${match.awayTeam.name} 看起来方向清楚，但${warnings}。尤其是赔率过低时，即使命中收益也不足。风险在哪里：这类比赛容易让人忽视投入回报比。结论：建议跳过或只观察，不保证命中。`;
  }

  return `为什么推荐：${title} 的综合信心为 ${score.confidence}，主要因为${reasons}。为什么仍需谨慎：${warnings}。风险在哪里：足球比赛有红牌、伤病和临场战术变化，推荐只用于辅助判断，不保证命中。`;
}
```

- [ ] **Step 4: Verify explanation tests pass**

Run:

```bash
npm test -- src/domain/explanations.test.ts
```

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit explanations**

```bash
git add src/domain/explanations.ts src/domain/explanations.test.ts
git commit -m "feat: add recommendation explanations"
```

---

## Task 6: React App State And User Flow Tests

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Create: `src/components/Disclaimer.tsx`

- [ ] **Step 1: Write the app flow test**

Create `src/App.test.tsx` with this content:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("shows matches first, then recommendations after analysis", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("今日世界杯赛事")).toBeInTheDocument();
    expect(screen.getByText("加拿大 VS 摩洛哥")).toBeInTheDocument();
    expect(screen.queryByText("今日稳胆 TOP3")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getByText("今日稳胆 TOP3")).toBeInTheDocument();
    expect(screen.getByText("今日价值投注 TOP3")).toBeInTheDocument();
    expect(screen.getByText("今日避坑比赛")).toBeInTheDocument();
    expect(screen.getByText("推荐串关")).toBeInTheDocument();
    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
  });

  it("opens match detail from a recommendation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "开始分析" }));
    await user.click(screen.getAllByRole("button", { name: /查看详情/ })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("评分拆解")).toBeInTheDocument();
    expect(screen.getByText("AI解释")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing app flow test**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `src/App.tsx` does not exist yet.

- [ ] **Step 3: Create the persistent disclaimer**

Create `src/components/Disclaimer.tsx` with this content:

```tsx
export function Disclaimer() {
  return (
    <footer className="disclaimer">
      <strong>辅助决策，不保证结果，不自动下注。</strong>
      <span>示例投入仅用于演示风险分层，请根据自身预算谨慎决定。</span>
    </footer>
  );
}
```

- [ ] **Step 4: Create the app shell**

Create `src/App.tsx` with this content:

```tsx
import { useMemo, useState } from "react";
import { todayMatches } from "./fixtures/worldCupMatches";
import { buildAnalysis } from "./domain/recommendations";
import type { Match, Recommendation } from "./domain/types";
import { explainRecommendation } from "./domain/explanations";
import { Disclaimer } from "./components/Disclaimer";
import "./styles.css";

export default function App() {
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const analysis = useMemo(() => buildAnalysis(todayMatches), []);

  const openMatch = (match: Match) => {
    const recommendation =
      analysis.safePicks.find((item) => item.match.id === match.id) ??
      analysis.valuePicks.find((item) => item.match.id === match.id) ??
      analysis.trapMatches.find((item) => item.match.id === match.id);
    if (recommendation) setSelected(recommendation);
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">世界杯竞彩决策助手 MVP</p>
          <h1>30 秒看懂今天是否值得小额参与</h1>
          <p className="hero-copy">不是预测神器，只把比赛数据、推荐方向和风险提示放到一个清楚的决策面板里。</p>
        </div>
        <div className="summary-card">
          <span>今日结论</span>
          <strong>{hasAnalysis ? analysis.summary : "等待分析，先查看今日比赛。"}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">今日世界杯赛事</p>
            <h2>{todayMatches.length} 场比赛待分析</h2>
          </div>
          <button className="primary-button" onClick={() => setHasAnalysis(true)}>
            开始分析
          </button>
        </div>
        <div className="match-list">
          {todayMatches.map((match) => (
            <button className="match-row" key={match.id} onClick={() => openMatch(match)}>
              <span>{match.kickoffTime}</span>
              <strong>{match.homeTeam.name} VS {match.awayTeam.name}</strong>
              <em>{match.odds?.handicap ?? "盘口缺失"}</em>
            </button>
          ))}
        </div>
      </section>

      {hasAnalysis && (
        <>
          <section className="recommendation-grid">
            <RecommendationColumn title="今日稳胆 TOP3" items={analysis.safePicks} onSelect={setSelected} />
            <RecommendationColumn title="今日价值投注 TOP3" items={analysis.valuePicks} onSelect={setSelected} />
            <RecommendationColumn title="今日避坑比赛" items={analysis.trapMatches} onSelect={setSelected} />
          </section>
          <section className="panel">
            <h2>推荐串关</h2>
            <div className="parlay-grid">
              {analysis.parlayPlans.map((plan) => (
                <article className="parlay-card" key={plan.id}>
                  <span>{plan.label}</span>
                  <strong>{plan.type}</strong>
                  <p>示例投入：{plan.sampleStake} 元</p>
                  <p>风险：{plan.risk}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <Disclaimer />

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setSelected(null)}>关闭</button>
            <h2>{selected.match.homeTeam.name} VS {selected.match.awayTeam.name}</h2>
            <p>{selected.match.kickoffTime} 开赛 · 推荐方向：{selected.score.direction}</p>
            <div className="detail-grid">
              <div><strong>{selected.match.homeTeam.name}</strong><span>FIFA {selected.match.homeTeam.fifaRank}</span></div>
              <div><strong>{selected.match.awayTeam.name}</strong><span>FIFA {selected.match.awayTeam.fifaRank}</span></div>
            </div>
            <h3>评分拆解</h3>
            <ul className="breakdown-list">
              {Object.entries(selected.score.breakdown).map(([key, value]) => (
                <li key={key}><span>{key}</span><strong>{value}</strong></li>
              ))}
            </ul>
            <h3>AI解释</h3>
            <p>{explainRecommendation(selected)}</p>
          </section>
        </div>
      )}
    </main>
  );
}

function RecommendationColumn({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: Recommendation[];
  onSelect: (item: Recommendation) => void;
}) {
  return (
    <section className="panel compact-panel">
      <h2>{title}</h2>
      {items.map((item, index) => (
        <article className="recommendation-card" key={item.id}>
          <span>#{index + 1}</span>
          <strong>{item.title}</strong>
          <p>信心：{item.score.confidence} · 风险：{item.score.risk}</p>
          <p>{item.reason}</p>
          <button onClick={() => onSelect(item)}>查看详情</button>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Create React entry point**

Create `src/main.tsx` with this content:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Add minimal CSS so tests render named elements clearly**

Create `src/styles.css` with this content:

```css
:root {
  font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #172018;
  background: #f5f7f1;
}

body {
  margin: 0;
}

button {
  font: inherit;
}

.app-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0;
}

.hero {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 24px;
  align-items: stretch;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #4f6b53;
  font-size: 13px;
  font-weight: 700;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  max-width: 720px;
  margin-bottom: 12px;
  font-size: 42px;
  line-height: 1.12;
}

.hero-copy {
  max-width: 680px;
  color: #526158;
}

.summary-card,
.panel {
  border: 1px solid #d9e1d5;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(44, 64, 47, 0.08);
}

.summary-card {
  display: grid;
  gap: 8px;
  padding: 20px;
}

.summary-card span,
.parlay-card span,
.recommendation-card span {
  color: #637061;
  font-size: 13px;
}

.summary-card strong {
  font-size: 22px;
}

.panel {
  padding: 20px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.primary-button,
.recommendation-card button,
.close-button {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.primary-button {
  padding: 12px 18px;
  color: #ffffff;
  background: #236c3a;
}

.match-list {
  display: grid;
  gap: 10px;
}

.match-row {
  display: grid;
  grid-template-columns: 76px 1fr minmax(140px, auto);
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 14px;
  border: 1px solid #dde5d9;
  border-radius: 8px;
  background: #fbfcfa;
  text-align: left;
  cursor: pointer;
}

.match-row em {
  color: #607063;
  font-style: normal;
  text-align: right;
}

.recommendation-grid,
.parlay-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 16px 0;
}

.compact-panel {
  display: grid;
  gap: 12px;
}

.recommendation-card,
.parlay-card {
  border: 1px solid #e1e8dd;
  border-radius: 8px;
  padding: 14px;
  background: #fbfcfa;
}

.recommendation-card button {
  margin-top: 8px;
  padding: 8px 10px;
  color: #236c3a;
  background: #e8f3e8;
}

.disclaimer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 20px;
  padding: 14px 0;
  color: #526158;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(16, 24, 18, 0.48);
}

.modal {
  width: min(720px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  border-radius: 8px;
  background: #ffffff;
  padding: 24px;
}

.close-button {
  float: right;
  padding: 8px 10px;
  background: #edf2ea;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-grid div,
.breakdown-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e1e8dd;
  border-radius: 8px;
  padding: 12px;
}

.breakdown-list {
  display: grid;
  gap: 8px;
  padding: 0;
  list-style: none;
}

@media (max-width: 760px) {
  .app-shell {
    width: min(100% - 24px, 560px);
    padding: 20px 0;
  }

  .hero,
  .recommendation-grid,
  .parlay-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 30px;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .match-row {
    grid-template-columns: 1fr;
  }

  .match-row em {
    text-align: left;
  }
}
```

- [ ] **Step 7: Verify app flow tests pass**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS with 2 tests.

- [ ] **Step 8: Commit app shell**

```bash
git add src/main.tsx src/App.tsx src/App.test.tsx src/components/Disclaimer.tsx src/styles.css
git commit -m "feat: add dashboard app shell"
```

---

## Task 7: Split UI Into Focused Components

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/Dashboard.tsx`
- Create: `src/components/MatchList.tsx`
- Create: `src/components/RecommendationSection.tsx`
- Create: `src/components/ParlayPlans.tsx`
- Create: `src/components/MatchDetailModal.tsx`

- [ ] **Step 1: Run current app test as a safety net**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS with 2 tests before refactoring.

- [ ] **Step 2: Create `MatchList`**

Create `src/components/MatchList.tsx` with this content:

```tsx
import type { Match } from "../domain/types";

export function MatchList({ matches, onSelect }: { matches: Match[]; onSelect: (match: Match) => void }) {
  if (matches.length === 0) {
    return <p className="empty-state">今日暂无世界杯赛事。</p>;
  }

  return (
    <div className="match-list">
      {matches.map((match) => (
        <button className="match-row" key={match.id} onClick={() => onSelect(match)}>
          <span>{match.kickoffTime}</span>
          <strong>{match.homeTeam.name} VS {match.awayTeam.name}</strong>
          <em>{match.odds?.handicap ?? "盘口缺失"}</em>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `RecommendationSection`**

Create `src/components/RecommendationSection.tsx` with this content:

```tsx
import type { Recommendation } from "../domain/types";

export function RecommendationSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: Recommendation[];
  onSelect: (item: Recommendation) => void;
}) {
  return (
    <section className="panel compact-panel">
      <h2>{title}</h2>
      {items.length === 0 && <p className="empty-state">推荐结果不足，请谨慎参考。</p>}
      {items.map((item, index) => (
        <article className="recommendation-card" key={item.id}>
          <span>#{index + 1}</span>
          <strong>{item.title}</strong>
          <p>信心：{item.score.confidence} · 风险：{item.score.risk}</p>
          <p>{item.reason}</p>
          <button onClick={() => onSelect(item)}>查看详情</button>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Create `ParlayPlans`**

Create `src/components/ParlayPlans.tsx` with this content:

```tsx
import type { ParlayPlan } from "../domain/types";

export function ParlayPlans({ plans }: { plans: ParlayPlan[] }) {
  return (
    <section className="panel">
      <h2>推荐串关</h2>
      <div className="parlay-grid">
        {plans.map((plan) => (
          <article className="parlay-card" key={plan.id}>
            <span>{plan.label}</span>
            <strong>{plan.type}</strong>
            <p>示例投入：{plan.sampleStake} 元</p>
            <p>风险：{plan.risk}</p>
            <small>{plan.picks.map((item) => item.title).join(" / ")}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `MatchDetailModal`**

Create `src/components/MatchDetailModal.tsx` with this content:

```tsx
import { explainRecommendation } from "../domain/explanations";
import type { Recommendation } from "../domain/types";

const labels: Record<string, string> = {
  strength: "球队实力",
  form: "近期状态",
  attack: "进攻能力",
  defense: "防守能力",
  headToHead: "历史交锋",
  market: "市场赔率",
};

export function MatchDetailModal({
  recommendation,
  onClose,
}: {
  recommendation: Recommendation;
  onClose: () => void;
}) {
  const { match, score } = recommendation;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}>关闭</button>
        <h2>{match.homeTeam.name} VS {match.awayTeam.name}</h2>
        <p>{match.kickoffTime} 开赛 · 推荐方向：{score.direction}</p>
        <div className="detail-grid">
          <div><strong>{match.homeTeam.name}</strong><span>FIFA {match.homeTeam.fifaRank}</span></div>
          <div><strong>{match.awayTeam.name}</strong><span>FIFA {match.awayTeam.fifaRank}</span></div>
        </div>
        <h3>最近5场</h3>
        <div className="form-grid">
          <p>{match.homeTeam.name}：{match.homeTeam.recentForm.map((item) => item.result).join(" ")}</p>
          <p>{match.awayTeam.name}：{match.awayTeam.recentForm.map((item) => item.result).join(" ")}</p>
        </div>
        <h3>评分拆解</h3>
        <ul className="breakdown-list">
          {Object.entries(score.breakdown).map(([key, value]) => (
            <li key={key}><span>{labels[key]}</span><strong>{value}</strong></li>
          ))}
        </ul>
        <h3>AI解释</h3>
        <p>{explainRecommendation(recommendation)}</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Create `Dashboard`**

Create `src/components/Dashboard.tsx` with this content:

```tsx
import type { AnalysisResult, Match, Recommendation } from "../domain/types";
import { MatchList } from "./MatchList";
import { ParlayPlans } from "./ParlayPlans";
import { RecommendationSection } from "./RecommendationSection";

export function Dashboard({
  matches,
  hasAnalysis,
  analysis,
  onAnalyze,
  onSelectMatch,
  onSelectRecommendation,
}: {
  matches: Match[];
  hasAnalysis: boolean;
  analysis: AnalysisResult;
  onAnalyze: () => void;
  onSelectMatch: (match: Match) => void;
  onSelectRecommendation: (item: Recommendation) => void;
}) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">世界杯竞彩决策助手 MVP</p>
          <h1>30 秒看懂今天是否值得小额参与</h1>
          <p className="hero-copy">不是预测神器，只把比赛数据、推荐方向和风险提示放到一个清楚的决策面板里。</p>
        </div>
        <div className="summary-card">
          <span>今日结论</span>
          <strong>{hasAnalysis ? analysis.summary : "等待分析，先查看今日比赛。"}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">今日世界杯赛事</p>
            <h2>{matches.length} 场比赛待分析</h2>
          </div>
          <button className="primary-button" onClick={onAnalyze}>
            开始分析
          </button>
        </div>
        <MatchList matches={matches} onSelect={onSelectMatch} />
      </section>

      {hasAnalysis && (
        <>
          <section className="recommendation-grid">
            <RecommendationSection title="今日稳胆 TOP3" items={analysis.safePicks} onSelect={onSelectRecommendation} />
            <RecommendationSection title="今日价值投注 TOP3" items={analysis.valuePicks} onSelect={onSelectRecommendation} />
            <RecommendationSection title="今日避坑比赛" items={analysis.trapMatches} onSelect={onSelectRecommendation} />
          </section>
          <ParlayPlans plans={analysis.parlayPlans} />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 7: Simplify `App.tsx` to orchestrate components**

Replace `src/App.tsx` with this content:

```tsx
import { useMemo, useState } from "react";
import { todayMatches } from "./fixtures/worldCupMatches";
import { buildAnalysis } from "./domain/recommendations";
import type { Match, Recommendation } from "./domain/types";
import { Dashboard } from "./components/Dashboard";
import { Disclaimer } from "./components/Disclaimer";
import { MatchDetailModal } from "./components/MatchDetailModal";
import "./styles.css";

export default function App() {
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const analysis = useMemo(() => buildAnalysis(todayMatches), []);

  const openMatch = (match: Match) => {
    const recommendation =
      analysis.safePicks.find((item) => item.match.id === match.id) ??
      analysis.valuePicks.find((item) => item.match.id === match.id) ??
      analysis.trapMatches.find((item) => item.match.id === match.id);
    if (recommendation) setSelected(recommendation);
  };

  return (
    <main className="app-shell">
      <Dashboard
        matches={todayMatches}
        hasAnalysis={hasAnalysis}
        analysis={analysis}
        onAnalyze={() => setHasAnalysis(true)}
        onSelectMatch={openMatch}
        onSelectRecommendation={setSelected}
      />
      <Disclaimer />
      {selected && <MatchDetailModal recommendation={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
```

- [ ] **Step 8: Verify refactor preserved behavior**

Run:

```bash
npm test -- src/App.test.tsx
npm test
```

Expected: PASS for all tests.

- [ ] **Step 9: Commit component split**

```bash
git add src/App.tsx src/components/Dashboard.tsx src/components/MatchList.tsx src/components/RecommendationSection.tsx src/components/ParlayPlans.tsx src/components/MatchDetailModal.tsx
git commit -m "refactor: split dashboard components"
```

---

## Task 8: Responsive Polish, Empty States, And Build Verification

**Files:**
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Add tests for empty or missing recommendation states**

Extend `src/App.test.tsx` with this test:

```tsx
it("keeps risk copy visible for users before and after analysis", async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
  await user.click(await screen.findByRole("button", { name: "开始分析" }));
  expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
  expect(screen.getByText(/示例投入仅用于演示风险分层/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused app tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS with 3 tests.

- [ ] **Step 3: Add missing-data visual styles**

Append these rules to `src/styles.css`:

```css
.empty-state {
  margin: 8px 0 0;
  color: #7a5a1f;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-grid p {
  border: 1px solid #e1e8dd;
  border-radius: 8px;
  padding: 12px;
  background: #fbfcfa;
}

.parlay-card small {
  display: block;
  color: #5c6b60;
  line-height: 1.5;
}

@media (max-width: 520px) {
  .panel,
  .summary-card,
  .modal {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .recommendation-card,
  .parlay-card {
    padding: 12px;
  }
}
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and Vite writes production output to `dist/`.

- [ ] **Step 5: Start the local app**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 6: Browser-check desktop flow**

Open the Vite local URL and verify:

- The first screen shows the product name, today’s matches, and “开始分析”.
- Clicking “开始分析” reveals “今日稳胆 TOP3”, “今日价值投注 TOP3”, “今日避坑比赛”, and “推荐串关”.
- Clicking “查看详情” opens the modal with “评分拆解” and “AI解释”.
- The disclaimer is visible near the bottom.

- [ ] **Step 7: Browser-check mobile width**

Use a mobile-width viewport around 390px and verify:

- Match rows stack vertically.
- Recommendation cards are one column.
- Modal content fits without horizontal clipping.
- Buttons remain tappable.

- [ ] **Step 8: Commit polish and verification**

```bash
git add src/styles.css src/App.test.tsx src/components/Dashboard.tsx
git commit -m "style: polish responsive dashboard"
```

---

## Task 9: README And Final Acceptance

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create user-facing README**

Create `README.md` with this content:

```md
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
```

- [ ] **Step 2: Run final command verification**

Run:

```bash
npm test
npm run build
git status --short
```

Expected:

- Tests pass.
- Build passes.
- `git status --short` shows only `README.md` as uncommitted before the final commit.

- [ ] **Step 3: Commit README**

```bash
git add README.md
git commit -m "docs: add project readme"
```

- [ ] **Step 4: Final acceptance check**

Run:

```bash
git status --short
git log --oneline -5
```

Expected:

- `git status --short` is empty.
- Recent commits include the scaffold, data service, scoring, recommendations, explanations, dashboard, polish, and README.

---

## Spec Coverage Review

- Product positioning and disclaimer: Tasks 6, 8, and 9.
- Local web app shape: Tasks 1, 6, and 8.
- Sample data with future API boundary: Task 2.
- Rule-based scoring with AI excluded from core calculation: Tasks 3 and 5.
- Stable/value/trap/parlay outputs: Task 4.
- Homepage and 30-second dashboard: Tasks 6 and 7.
- Match details with FIFA ranking, recent form, goals, score breakdown, explanations, and risk: Tasks 6 and 7.
- Empty and missing-data states: Tasks 7 and 8.
- Responsive desktop and mobile acceptance: Task 8.
- Final documentation: Task 9.

## Implementation Notes

- Keep calculation functions pure and covered by unit tests.
- Keep React components presentational where possible; `App.tsx` owns simple page state.
- Do not add login, payment, chat, community, historical database, automatic betting, automatic ticketing, or user budget management.
- If real API work begins in a separate version, add it behind `src/services/matchService.ts` without changing domain scoring inputs.
