import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { todayMatches } from "./fixtures/worldCupMatches";
import { getTodayMatches } from "./services/matchService";

const { getTodayMatchesMock } = vi.hoisted(() => ({
  getTodayMatchesMock: vi.fn(),
}));

vi.mock("./services/matchService", () => ({
  getTodayMatches: getTodayMatchesMock,
}));

describe("App", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    getTodayMatchesMock.mockReset();
    getTodayMatchesMock.mockResolvedValue({ matches: todayMatches, source: "football-data" });
  });

  it("loads matches through the match service boundary", async () => {
    render(<App />);

    expect(getTodayMatches).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    expect(screen.getByText("🇨🇦", { selector: ".team-flag" })).toBeInTheDocument();
  });

  it("shows date tabs under the title and defaults to today", async () => {
    render(<App />);

    expect(await screen.findByRole("tab", { name: /今天/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /昨天/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /明天/ })).toBeInTheDocument();
    expect(screen.getByText("今日世界杯赛事")).toBeInTheDocument();
    expect(screen.getByText(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
  });

  it("switches match date without refreshing the page", async () => {
    const user = userEvent.setup();
    const tomorrowMatch = {
      ...todayMatches[0],
      id: "tomorrow-france-brazil",
      matchDate: "2026-06-27",
      kickoffTime: "08:00",
      homeTeam: { ...todayMatches[0].homeTeam, id: "france", name: "法国" },
      awayTeam: { ...todayMatches[0].awayTeam, id: "brazil", name: "巴西" },
    };
    getTodayMatchesMock
      .mockResolvedValueOnce({ matches: todayMatches, source: "football-data" })
      .mockResolvedValueOnce({ matches: [tomorrowMatch], source: "football-data" });

    render(<App />);

    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /明天/ }));

    expect(await screen.findByText("法国")).toBeInTheDocument();
    expect(screen.getByText("🇫🇷", { selector: ".team-flag" })).toBeInTheDocument();
    expect(getTodayMatches).toHaveBeenCalledTimes(2);
  });

  it("sorts matches by kickoff time", async () => {
    getTodayMatchesMock.mockResolvedValue({
      source: "football-data",
      matches: [
        { ...todayMatches[0], id: "late", kickoffTime: "10:00" },
        { ...todayMatches[1], id: "early", kickoffTime: "03:00" },
        { ...todayMatches[2], id: "middle", kickoffTime: "08:00" },
      ],
    });

    render(<App />);

    const kickoffTimes = (await screen.findAllByTestId("match-kickoff")).map((item) => item.textContent);
    expect(kickoffTimes).toEqual(["03:00 开赛", "08:00 开赛", "10:00 开赛"]);
  });

  it("shows an empty state when the real API returns no World Cup matches today", async () => {
    getTodayMatchesMock.mockResolvedValue({ matches: [], source: "football-data" });

    render(<App />);

    expect(await screen.findByText("今日暂无世界杯比赛。")).toBeInTheDocument();
    expect(screen.queryByText("今日赛事数据获取失败，请稍后重试。")).not.toBeInTheDocument();
  });

  it("shows a clear user-facing message when the match API fails", async () => {
    getTodayMatchesMock.mockResolvedValue({
      matches: todayMatches,
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
    const [matchWithoutOdds] = todayMatches.map((match) => ({ ...match, odds: undefined }));
    getTodayMatchesMock.mockResolvedValue({ matches: [matchWithoutOdds], source: "football-data" });
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

    expect(screen.getAllByText("加拿大主胜").length).toBeGreaterThan(0);
  });

  it("does not force betting recommendations before odds are fetched", async () => {
    const user = userEvent.setup();
    const [matchWithoutOdds] = todayMatches.map((match) => ({ ...match, odds: undefined }));
    getTodayMatchesMock.mockResolvedValue({ matches: [matchWithoutOdds], source: "football-data" });
    render(<App />);

    expect(await screen.findByText("加拿大")).toBeInTheDocument();
    expect(screen.queryByText("缺少赔率，暂不建议下注")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getAllByText("推荐结果不足，请谨慎参考。").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("加拿大主胜")).not.toBeInTheDocument();
  });

  it("shows a concise retry message when odds fetching fails", async () => {
    const user = userEvent.setup();
    const [matchWithoutOdds] = todayMatches.map((match) => ({ ...match, odds: undefined }));
    getTodayMatchesMock.mockResolvedValue({ matches: [matchWithoutOdds], source: "football-data" });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "今日赔率获取失败，请稍后重试。" }), { status: 502 }),
    );
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "自动获取赔率" }));

    expect(await screen.findByText("今日赔率获取失败，请稍后重试。")).toBeInTheDocument();
    expect(screen.queryByText(/JSON|404|stack|接口异常/)).not.toBeInTheDocument();
  });
});
