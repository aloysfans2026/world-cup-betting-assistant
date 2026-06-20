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
  beforeEach(() => {
    window.localStorage.clear();
    getTodayMatchesMock.mockReset();
    getTodayMatchesMock.mockResolvedValue({ matches: todayMatches, source: "mock-fallback" });
  });

  it("loads matches through the match service boundary", async () => {
    render(<App />);

    expect(getTodayMatches).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("加拿大 VS 摩洛哥")).toBeInTheDocument();
  });

  it("shows a clear fallback message when the match API fails", async () => {
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
    expect(screen.getByText("网络错误，已使用本地示例数据。")).toBeInTheDocument();
    expect(screen.getByText("加拿大 VS 摩洛哥")).toBeInTheDocument();
  });

  it("shows matches first, then recommendations after analysis", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("今日世界杯赛事")).toBeInTheDocument();
    expect(await screen.findByText("加拿大 VS 摩洛哥")).toBeInTheDocument();
    expect(screen.queryByText("今日稳胆 TOP3")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getByText("今日稳胆 TOP3")).toBeInTheDocument();
    expect(screen.getByText("今日价值投注 TOP3")).toBeInTheDocument();
    expect(screen.getByText("今日避坑比赛")).toBeInTheDocument();
    expect(screen.getByText("推荐串关")).toBeInTheDocument();
    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
  });

  it("does not reveal match analysis before the user starts analysis", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /加拿大 VS 摩洛哥/ }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("AI解释")).not.toBeInTheDocument();
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

  it("keeps risk copy visible for users before and after analysis", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "开始分析" }));
    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
    expect(screen.getByText(/示例投入仅用于演示风险分层/)).toBeInTheDocument();
  });

  it("lets users manually enter win draw loss odds before analysis", async () => {
    const user = userEvent.setup();
    const [matchWithoutOdds] = todayMatches.map((match) => ({ ...match, odds: undefined }));
    getTodayMatchesMock.mockResolvedValue({ matches: [matchWithoutOdds], source: "football-data" });
    render(<App />);

    await user.type(await screen.findByLabelText("加拿大主胜赔率"), "1.82");
    await user.type(screen.getByLabelText("加拿大平局赔率"), "3.20");
    await user.type(screen.getByLabelText("加拿大客胜赔率"), "4.10");
    await user.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getAllByText("加拿大主胜").length).toBeGreaterThan(0);
    expect(screen.queryByText("缺少赔率，暂不建议下注")).not.toBeInTheDocument();
  });

  it("does not force betting recommendations when odds are missing", async () => {
    const user = userEvent.setup();
    const [matchWithoutOdds] = todayMatches.map((match) => ({ ...match, odds: undefined }));
    getTodayMatchesMock.mockResolvedValue({ matches: [matchWithoutOdds], source: "football-data" });
    render(<App />);

    expect(await screen.findByText("缺少赔率，暂不建议下注")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "开始分析" }));

    expect(screen.getAllByText("推荐结果不足，请谨慎参考。").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("加拿大主胜")).not.toBeInTheDocument();
  });
});
