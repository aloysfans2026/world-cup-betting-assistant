import { describe, expect, it } from "vitest";
import { getTeamFlag, normalizeTeamName, toChineseTeamName } from "./teamFlagService";

describe("teamFlagService", () => {
  it("maps English team names to Chinese names", () => {
    expect(toChineseTeamName("Turkey")).toBe("土耳其");
    expect(toChineseTeamName("USA")).toBe("美国");
    expect(toChineseTeamName("Germany")).toBe("德国");
    expect(toChineseTeamName("France")).toBe("法国");
    expect(toChineseTeamName("Japan")).toBe("日本");
    expect(toChineseTeamName("Brazil")).toBe("巴西");
    expect(toChineseTeamName("Australia")).toBe("澳大利亚");
    expect(toChineseTeamName("Norway")).toBe("挪威");
  });

  it("returns flags from the shared team mapping", () => {
    expect(getTeamFlag("法国")).toBe("🇫🇷");
    expect(getTeamFlag("Brazil")).toBe("🇧🇷");
    expect(getTeamFlag("USA")).toBe("🇺🇸");
  });

  it("normalizes Chinese and English aliases to the same token", () => {
    expect(normalizeTeamName("United States")).toBe(normalizeTeamName("美国"));
    expect(normalizeTeamName("沙特")).toBe(normalizeTeamName("沙特阿拉伯"));
  });
});
