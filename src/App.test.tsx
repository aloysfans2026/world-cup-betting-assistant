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

  it("keeps risk copy visible for users before and after analysis", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "开始分析" }));
    expect(screen.getByText("辅助决策，不保证结果，不自动下注。")).toBeInTheDocument();
    expect(screen.getByText(/示例投入仅用于演示风险分层/)).toBeInTheDocument();
  });
});
