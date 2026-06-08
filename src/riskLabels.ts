export function riskFlagLabel(flag: string): string {
  switch (flag) {
    case "long_base64_like_token":
      return "긴 토큰 형식 문자열";
    case "private_key":
    case "private_key_marker":
      return "비공개 키 표식";
    case "possible_api_key":
    case "short_secret_like_assignment":
      return "비밀값 형태 할당";
    default:
      return flag || "알 수 없음";
  }
}
