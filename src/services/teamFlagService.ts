export interface TeamFlagMeta {
  chineseName: string;
  englishNames: string[];
  isoCode: string;
  emoji: string;
}

export const teamFlagEntries: TeamFlagMeta[] = [
  { chineseName: "阿根廷", englishNames: ["argentina"], isoCode: "AR", emoji: "🇦🇷" },
  { chineseName: "澳大利亚", englishNames: ["australia", "australian"], isoCode: "AU", emoji: "🇦🇺" },
  { chineseName: "奥地利", englishNames: ["austria"], isoCode: "AT", emoji: "🇦🇹" },
  { chineseName: "比利时", englishNames: ["belgium"], isoCode: "BE", emoji: "🇧🇪" },
  { chineseName: "巴西", englishNames: ["brazil"], isoCode: "BR", emoji: "🇧🇷" },
  { chineseName: "加拿大", englishNames: ["canada"], isoCode: "CA", emoji: "🇨🇦" },
  { chineseName: "喀麦隆", englishNames: ["cameroon"], isoCode: "CM", emoji: "🇨🇲" },
  { chineseName: "智利", englishNames: ["chile"], isoCode: "CL", emoji: "🇨🇱" },
  { chineseName: "哥伦比亚", englishNames: ["colombia"], isoCode: "CO", emoji: "🇨🇴" },
  { chineseName: "哥斯达黎加", englishNames: ["costa rica", "costarica"], isoCode: "CR", emoji: "🇨🇷" },
  { chineseName: "克罗地亚", englishNames: ["croatia"], isoCode: "HR", emoji: "🇭🇷" },
  { chineseName: "丹麦", englishNames: ["denmark"], isoCode: "DK", emoji: "🇩🇰" },
  { chineseName: "厄瓜多尔", englishNames: ["ecuador"], isoCode: "EC", emoji: "🇪🇨" },
  { chineseName: "埃及", englishNames: ["egypt"], isoCode: "EG", emoji: "🇪🇬" },
  { chineseName: "英格兰", englishNames: ["england"], isoCode: "GB-ENG", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { chineseName: "法国", englishNames: ["france"], isoCode: "FR", emoji: "🇫🇷" },
  { chineseName: "德国", englishNames: ["germany", "deutschland"], isoCode: "DE", emoji: "🇩🇪" },
  { chineseName: "加纳", englishNames: ["ghana"], isoCode: "GH", emoji: "🇬🇭" },
  { chineseName: "海地", englishNames: ["haiti"], isoCode: "HT", emoji: "🇭🇹" },
  { chineseName: "伊朗", englishNames: ["iran"], isoCode: "IR", emoji: "🇮🇷" },
  { chineseName: "伊拉克", englishNames: ["iraq"], isoCode: "IQ", emoji: "🇮🇶" },
  { chineseName: "意大利", englishNames: ["italy"], isoCode: "IT", emoji: "🇮🇹" },
  { chineseName: "日本", englishNames: ["japan"], isoCode: "JP", emoji: "🇯🇵" },
  { chineseName: "约旦", englishNames: ["jordan"], isoCode: "JO", emoji: "🇯🇴" },
  { chineseName: "韩国", englishNames: ["korea republic", "south korea", "korea"], isoCode: "KR", emoji: "🇰🇷" },
  { chineseName: "摩洛哥", englishNames: ["morocco"], isoCode: "MA", emoji: "🇲🇦" },
  { chineseName: "墨西哥", englishNames: ["mexico"], isoCode: "MX", emoji: "🇲🇽" },
  { chineseName: "荷兰", englishNames: ["netherlands", "holland"], isoCode: "NL", emoji: "🇳🇱" },
  { chineseName: "新西兰", englishNames: ["new zealand", "newzealand"], isoCode: "NZ", emoji: "🇳🇿" },
  { chineseName: "挪威", englishNames: ["norway"], isoCode: "NO", emoji: "🇳🇴" },
  { chineseName: "巴拿马", englishNames: ["panama"], isoCode: "PA", emoji: "🇵🇦" },
  { chineseName: "巴拉圭", englishNames: ["paraguay"], isoCode: "PY", emoji: "🇵🇾" },
  { chineseName: "波兰", englishNames: ["poland"], isoCode: "PL", emoji: "🇵🇱" },
  { chineseName: "葡萄牙", englishNames: ["portugal"], isoCode: "PT", emoji: "🇵🇹" },
  { chineseName: "卡塔尔", englishNames: ["qatar"], isoCode: "QA", emoji: "🇶🇦" },
  { chineseName: "沙特阿拉伯", englishNames: ["saudi arabia", "saudiarabia", "saudi", "沙特"], isoCode: "SA", emoji: "🇸🇦" },
  { chineseName: "苏格兰", englishNames: ["scotland"], isoCode: "GB-SCT", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { chineseName: "塞内加尔", englishNames: ["senegal"], isoCode: "SN", emoji: "🇸🇳" },
  { chineseName: "塞尔维亚", englishNames: ["serbia"], isoCode: "RS", emoji: "🇷🇸" },
  { chineseName: "南非", englishNames: ["south africa", "southafrica"], isoCode: "ZA", emoji: "🇿🇦" },
  { chineseName: "西班牙", englishNames: ["spain"], isoCode: "ES", emoji: "🇪🇸" },
  { chineseName: "瑞士", englishNames: ["switzerland", "swiss"], isoCode: "CH", emoji: "🇨🇭" },
  { chineseName: "突尼斯", englishNames: ["tunisia"], isoCode: "TN", emoji: "🇹🇳" },
  { chineseName: "土耳其", englishNames: ["turkey", "turkiye", "türkiye"], isoCode: "TR", emoji: "🇹🇷" },
  { chineseName: "美国", englishNames: ["usa", "united states", "unitedstates", "us", "u.s.a."], isoCode: "US", emoji: "🇺🇸" },
  { chineseName: "乌拉圭", englishNames: ["uruguay"], isoCode: "UY", emoji: "🇺🇾" },
  { chineseName: "乌兹别克斯坦", englishNames: ["uzbekistan", "乌兹别克"], isoCode: "UZ", emoji: "🇺🇿" },
  { chineseName: "威尔士", englishNames: ["wales"], isoCode: "GB-WLS", emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { chineseName: "阿尔及利亚", englishNames: ["algeria"], isoCode: "DZ", emoji: "🇩🇿" },
  { chineseName: "佛得角", englishNames: ["cape verde", "capeverde"], isoCode: "CV", emoji: "🇨🇻" },
  { chineseName: "刚果金", englishNames: ["dr congo", "drcongo", "congo dr", "congodr", "刚果(金)"], isoCode: "CD", emoji: "🇨🇩" },
];

export function normalizeTeamToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[（）()]/g, "")
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, "")
    .replace(/队$/u, "")
    .trim();
}

const teamByAlias = teamFlagEntries.reduce<Record<string, TeamFlagMeta>>((teams, entry) => {
  [entry.chineseName, ...entry.englishNames].forEach((name) => {
    teams[normalizeTeamToken(name)] = entry;
  });
  return teams;
}, {});

export function getTeamFlagMeta(value: string): TeamFlagMeta | undefined {
  return teamByAlias[normalizeTeamToken(value)];
}

export function getTeamFlag(value: string): string {
  return getTeamFlagMeta(value)?.emoji ?? "🏳️";
}

export function toChineseTeamName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "待定";

  return getTeamFlagMeta(trimmed)?.chineseName ?? trimmed;
}

export function normalizeTeamName(value: string): string {
  return normalizeTeamToken(toChineseTeamName(value));
}
