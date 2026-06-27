import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { todayMatches } from "./fixtures/worldCupMatches";
import { getMatchesForDateRange } from "./services/matchService";

const { getMatchesForDateRangeMock } = vi.hoisted(() => ({
  getMatchesForDateRangeMock: vi.fn(),
}));

vi.mock("./services/matchService", () => ({
  getMatchesForDateRange: getMatchesForDateRangeMock,
}));

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function matchesForDate(date: string) {
  return todayMatches.map((match) => ({ ...match, matchDate: date }));
}

describe("App", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    const todayDate = formatLocalDate(new Date());
    window.localStorage.clear();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    getMatchesForDateRangeMock.mockReset();
    getMatchesForDateRangeMock.mockResolvedValue({ matches: matchesForDate(todayDate), source: "football-data" });
  });

  it("loads matches through the match service boundary", async () => {
    render(<App />);

    expect(getMatchesForDateRange).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    expect(screen.getByText("🇨🇦", { selector: ".team-flag" })).toBeInTheDocument();
  });

  it("shows date tabs under the title and defaults to today", async () => {
    render(<App />);

    const todayTab = await screen.findByRole("tab", { current: "date" });
    expect(todayTab).toHaveAttribute("aria-selected", "true");
    expect(todayTab).toHaveTextContent(/\d{2}月\d{2}日/);
    expect(todayTab).not.toHaveTextContent(/今天|昨天|明天/);
    expect(todayTab.querySelector(".today-dot")).toBeInTheDocument();
    expect(screen.queryByText("昨天")).not.toBeInTheDocument();
    expect(screen.queryByText("今天")).not.toBeInTheDocument();
    expect(screen.queryByText("明天")).not.toBeInTheDocument();
    expect(screen.getByText("今日世界杯赛事")).toBeInTheDocument();
    expect(screen.getByText(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
  });

  it("switches match date without refreshing the page", async () => {
    const user = userEvent.setup();
    const todayDate = formatLocalDate(new Date());
    const tomorrowDate = formatLocalDate(addDays(new Date(), 1));
    const tomorrowMatch = {
      ...todayMatches[0],
      id: "tomorrow-france-brazil",
      matchDate: tomorrowDate,
      kickoffTime: "08:00",
      homeTeam: { ...todayMatches[0].homeTeam, id: "france", name: "法国" },
      awayTeam: { ...todayMatches[0].awayTeam, id: "brazil", name: "巴西" },
    };
    getMatchesForDateRangeMock.mockResolvedValueOnce({
      matches: [...matchesForDate(todayDate), tomorrowMatch],
      source: "football-data",
    });

    render(<App />);

    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    const nextDateTab = screen.getAllByRole("tab")[4];
    await user.click(nextDateTab);

    expect(await screen.findByText("法国")).toBeInTheDocument();
    expect(screen.getByText("🇫🇷", { selector: ".team-flag" })).toBeInTheDocument();
    expect(getMatchesForDateRange).toHaveBeenCalledTimes(1);
  });

  it("sorts matches by kickoff time", async () => {
    const todayDate = formatLocalDate(new Date());
    getMatchesForDateRangeMock.mockResolvedValue({
      source: "football-data",
      matches: [
        { ...todayMatches[0], id: "late", matchDate: todayDate, kickoffTime: "10:00" },
        { ...todayMatches[1], id: "early", matchDate: todayDate, kickoffTime: "03:00" },
        { ...todayMatches[2], id: "middle", matchDate: todayDate, kickoffTime: "08:00" },
      ],
    });

    render(<App />);

    const kickoffTimes = (await screen.findAllByTestId("match-kickoff")).map((item) => item.textContent);
    expect(kickoffTimes).toEqual(["03:00", "08:00", "10:00"]);
  });

  it("shows kickoff time, match status, and final result separately", async () => {
    const todayDate = formatLocalDate(new Date());
    getMatchesForDateRangeMock.mockResolvedValue({
      source: "sporttery",
      matches: [
        {
          ...todayMatches[0],
          id: "live-match",
          matchDate: todayDate,
          kickoffTime: "08:00",
          status: "进行中",
          homeScore: 0,
          awayScore: 1,
          homeTeam: { ...todayMatches[0].homeTeam, name: "乌拉圭" },
          awayTeam: { ...todayMatches[0].awayTeam, name: "西班牙" },
        },
        {
          ...todayMatches[1],
          id: "finished-match",
          matchDate: todayDate,
          kickoffTime: "03:00",
          status: "已结束",
          homeScore: 5,
          awayScore: 0,
          homeTeam: { ...todayMatches[1].homeTeam, name: "塞内加尔" },
          awayTeam: { ...todayMatches[1].awayTeam, name: "伊拉克" },
        },
      ],
    });

    render(<App />);

    const liveCard = (await screen.findByText("乌拉圭")).closest(".match-card");
    expect(liveCard).not.toBeNull();
    expect(within(liveCard as HTMLElement).getByTestId("match-kickoff")).toHaveTextContent("08:00");
    expect(within(liveCard as HTMLElement).getByText("进行中")).toBeInTheDocument();
    expect(within(liveCard as HTMLElement).queryByTestId("match-result")).not.toBeInTheDocument();

    const finishedCard = screen.getByText("塞内加尔").closest(".match-card");
    expect(finishedCard).not.toBeNull();
    expect(within(finishedCard as HTMLElement).getByTestId("match-kickoff")).toHaveTextContent("03:00");
    expect(within(finishedCard as HTMLElement).getByText("已结束")).toBeInTheDocument();
    expect(within(finishedCard as HTMLElement).getByTestId("match-result")).toHaveTextContent("赛果 5:0");
  });

  it("shows an empty state when the real API returns no World Cup matches today", async () => {
    getMatchesForDateRangeMock.mockResolvedValue({ matches: [], source: "football-data" });

    render(<App />);

    expect(await screen.findByText("今日暂无世界杯比赛。")).toBeInTheDocument();
    expect(screen.queryByText("今日赛事数据获取失败，请稍后重试。")).not.toBeInTheDocument();
  });

  it("shows a clear user-facing message when the match API fails", async () => {
    const todayDate = formatLocalDate(new Date());
    getMatchesForDateRangeMock.mockResolvedValue({
      matches: matchesForDate(todayDate),
      source: "mock-fallback",
      issue: {
        kind: "network",
        message: "今日赛事数据获取失败，请稍后重试。",
        detail: "网络错误，已使用本地示例数据。",
      },
    });

    render(<App />);

    expect(await screen.findByText("今日赛事数据获取失败，请稍后重试。")).toBeInTheDocument();
    expect(screen.queryByText("网络错误，已使用本地示例数据。")).not.toBeInTheDocument();
    expect(screen.getByText("加拿大")).toBeInTheDocument();
  });

  it("shows matches first, then recommendations after analysis", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("今日世界杯赛事")).toBeInTheDocument();
    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    expect(screen.queryByText("今日稳胆前三")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getByText("今日稳胆前三")).toBeInTheDocument();
    expect(screen.getByText("今日价值前三")).toBeInTheDocument();
    expect(screen.getByText("今日避坑比赛")).toBeInTheDocument();
    expect(screen.getByText("推荐串关")).toBeInTheDocument();
    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
  });

  it("does not reveal match analysis before the user starts analysis", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    expect(screen.queryByText("AI解释")).not.toBeInTheDocument();
  });

  it("keeps the page to the two core action buttons", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("加拿大");
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["自动获取赔率", "开始分析"]);

    await user.click(screen.getByRole("button", { name: "开始分析" }));
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["自动获取赔率", "开始分析"]);
  });

  it("keeps risk copy visible for users before and after analysis", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "开始分析" }));
    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
    expect(screen.getByText(/示例投入仅用于演示风险分层/)).toBeInTheDocument();
  });

  it("does not render odds entry or screenshot upload controls", async () => {
    render(<App />);

    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    expect(screen.queryByLabelText("加拿大主胜赔率")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("加拿大平局赔率")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("加拿大客胜赔率")).not.toBeInTheDocument();
    expect(screen.queryByText("上传赔率截图")).not.toBeInTheDocument();
  });

  it("fetches odds automatically and fills matches without user input", async () => {
    const user = userEvent.setup();
    const todayDate = formatLocalDate(new Date());
    const [matchWithoutOdds] = matchesForDate(todayDate).map((match) => ({ ...match, odds: undefined }));
    getMatchesForDateRangeMock.mockResolvedValue({ matches: [matchWithoutOdds], source: "football-data" });
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          date: "2026-06-26",
          source: "sporttery",
          updatedAt: "2026-06-26 16:53:24",
          odds: [
            {
              homeTeam: "加拿大",
              awayTeam: "摩洛哥",
              homeWin: 1.82,
              draw: 3.2,
              awayWin: 4.1,
              source: "sporttery",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "自动获取赔率" }));

    expect(await screen.findByText(/赔率已更新/)).toBeInTheDocument();
    expect(screen.getByText("主胜 1.82")).toBeInTheDocument();
    expect(screen.getByText("平 3.2")).toBeInTheDocument();
    expect(screen.getByText("客胜 4.1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getAllByText("加拿大胜").length).toBeGreaterThan(0);
  });

  it("does not show bundled sample odds before automatic odds are fetched", async () => {
    render(<App />);

    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    expect(screen.queryByText("主胜 2.15")).not.toBeInTheDocument();
    expect(screen.queryByText("平 3.05")).not.toBeInTheDocument();
    expect(screen.queryByText("客胜 3.35")).not.toBeInTheDocument();
  });

  it("does not force betting recommendations before odds are fetched", async () => {
    const user = userEvent.setup();
    const todayDate = formatLocalDate(new Date());
    const [matchWithoutOdds] = matchesForDate(todayDate).map((match) => ({ ...match, odds: undefined }));
    getMatchesForDateRangeMock.mockResolvedValue({ matches: [matchWithoutOdds], source: "football-data" });
    render(<App />);

    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    expect(screen.queryByText("缺少赔率，暂不建议下注")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getAllByText("推荐结果不足，请谨慎参考。").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("加拿大胜")).not.toBeInTheDocument();
  });

  it("shows a concise retry message when odds fetching fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "今日赔率获取失败，请稍后重试。" }), { status: 502 }),
    );
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "自动获取赔率" }));

    expect(await screen.findByText("今日赔率获取失败，请稍后重试。")).toBeInTheDocument();
    expect(screen.queryByText("主胜 2.15")).not.toBeInTheDocument();
    expect(screen.queryByText("平 3.05")).not.toBeInTheDocument();
    expect(screen.queryByText("客胜 3.35")).not.toBeInTheDocument();
    expect(screen.queryByText(/JSON|404|stack|接口异常/)).not.toBeInTheDocument();
  });
});
