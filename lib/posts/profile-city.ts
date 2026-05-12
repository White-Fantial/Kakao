import { prisma } from '@/lib/db/prisma';

export const PROFILE_CITY_REQUIRED_MESSAGE = '글을 쓰기 전에 지역을 먼저 설정해 주세요.';

export function getProfileCityRequiredHref(returnTo: string, message = PROFILE_CITY_REQUIRED_MESSAGE) {
  const safeReturnTo = normalizeInternalPath(returnTo);

  if (!safeReturnTo) {
    return `/my/profile?error=${encodeURIComponent(message)}`;
  }

  return `/my/profile?returnTo=${encodeURIComponent(safeReturnTo)}&error=${encodeURIComponent(message)}`;
}

/**
 * A valid profile city means:
 * - user has a selected country and city
 * - city exists and is active
 * - city belongs to the user's selected country
 *
 * Accepts the city/country IDs already present in the session user, so only
 * one DB query (the city lookup) is needed instead of two.
 */
export async function hasValidProfileCity(
  cityId: string | null | undefined,
  countryId: string | null | undefined,
) {
  if (!cityId || !countryId) {
    return false;
  }

  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: { countryId: true, isActive: true },
  });

  if (!city || !city.isActive) {
    return false;
  }

  return city.countryId === countryId;
}

export function normalizeInternalPath(value: string) {
  const candidate = value.trim();

  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return null;
  }

  if (/[\r\n\t]/.test(candidate)) {
    return null;
  }

  try {
    const url = new URL(candidate, 'https://kakao.local');

    if (url.origin !== 'https://kakao.local') {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
