const teamAliases: Record<string, string[]> = {
  阿根廷: ["argentina", "阿根廷"],
  澳大利亚: ["australia", "australian", "澳大利亚"],
  奥地利: ["austria", "奥地利"],
  比利时: ["belgium", "比利时"],
  巴西: ["brazil", "巴西"],
  加拿大: ["canada", "加拿大"],
  智利: ["chile", "智利"],
  哥伦比亚: ["colombia", "哥伦比亚"],
  哥斯达黎加: ["costa rica", "costarica", "哥斯达黎加"],
  克罗地亚: ["croatia", "克罗地亚"],
  丹麦: ["denmark", "丹麦"],
  厄瓜多尔: ["ecuador", "厄瓜多尔"],
  埃及: ["egypt", "埃及"],
  英格兰: ["england", "英格兰"],
  法国: ["france", "法国"],
  德国: ["germany", "deutschland", "德国"],
  加纳: ["ghana", "加纳"],
  海地: ["haiti", "海地"],
  伊朗: ["iran", "伊朗"],
  伊拉克: ["iraq", "伊拉克"],
  意大利: ["italy", "意大利"],
  日本: ["japan", "日本"],
  约旦: ["jordan", "约旦"],
  韩国: ["korea republic", "south korea", "korea", "韩国"],
  摩洛哥: ["morocco", "摩洛哥"],
  墨西哥: ["mexico", "墨西哥"],
  荷兰: ["netherlands", "holland", "荷兰"],
  新西兰: ["new zealand", "newzealand", "新西兰"],
  挪威: ["norway", "挪威"],
  巴拿马: ["panama", "巴拿马"],
  巴拉圭: ["paraguay", "巴拉圭"],
  波兰: ["poland", "波兰"],
  葡萄牙: ["portugal", "葡萄牙"],
  卡塔尔: ["qatar", "卡塔尔"],
  沙特阿拉伯: ["saudi arabia", "saudiarabia", "saudi", "沙特阿拉伯", "沙特"],
  苏格兰: ["scotland", "苏格兰"],
  塞内加尔: ["senegal", "塞内加尔"],
  塞尔维亚: ["serbia", "塞尔维亚"],
  南非: ["south africa", "southafrica", "南非"],
  西班牙: ["spain", "西班牙"],
  瑞士: ["switzerland", "swiss", "瑞士"],
  突尼斯: ["tunisia", "突尼斯"],
  土耳其: ["turkey", "turkiye", "türkiye", "土耳其"],
  美国: ["usa", "united states", "unitedstates", "us", "u.s.a.", "美国"],
  乌拉圭: ["uruguay", "乌拉圭"],
  乌兹别克斯坦: ["uzbekistan", "乌兹别克斯坦", "乌兹别克"],
  威尔士: ["wales", "威尔士"],
  阿尔及利亚: ["algeria", "阿尔及利亚"],
  佛得角: ["cape verde", "capeverde", "佛得角"],
  刚果金: ["dr congo", "drcongo", "congo dr", "congodr", "刚果(金)", "刚果金"],
};

export function normalizeTeamToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[（）()]/g, "")
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, "")
    .replace(/队$/u, "")
    .trim();
}

const aliasToChinese = Object.entries(teamAliases).reduce<Record<string, string>>((aliases, [chineseName, names]) => {
  [chineseName, ...names].forEach((name) => {
    aliases[normalizeTeamToken(name)] = chineseName;
  });
  return aliases;
}, {});

export function toChineseTeamName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "待定";

  return aliasToChinese[normalizeTeamToken(trimmed)] ?? trimmed;
}

export function normalizeTeamName(value: string): string {
  return normalizeTeamToken(toChineseTeamName(value));
}
