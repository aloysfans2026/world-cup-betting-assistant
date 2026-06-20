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
    getTodayMatchesMock.mockReset();
    getTodayMatchesMock.mockResolvedValue(todayMatches);
  });

  it("loads matches through the match service boundary", async () => {
    render(<App />);

    expect(getTodayMatches).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("加拿大 VS 摩洛哥")).toBeInTheDocument();
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
});
