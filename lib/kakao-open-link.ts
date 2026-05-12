const KAKAO_OPEN_LINK_PATTERN = /https?:\/\/open\.kakao\.com\/o\/[A-Za-z0-9_-]+/;
const KAKAO_OPEN_LINK_STRICT_PATTERN = /^https:\/\/open\.kakao\.com\/o\/[A-Za-z0-9_-]+$/;

export function extractKakaoOpenLink(input: string): string {
  if (!input) return '';

  const match = input.match(KAKAO_OPEN_LINK_PATTERN);
  return match ? match[0].replace(/^http:\/\//, 'https://') : input.trim();
}

export function isValidKakaoOpenLink(input: string): boolean {
  const cleaned = extractKakaoOpenLink(input);
  return KAKAO_OPEN_LINK_STRICT_PATTERN.test(cleaned);
}
