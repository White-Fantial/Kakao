type CountryOption = {
  id: string;
  name: string;
  slug: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveCountryNameFromIsoCode(countryCode: string | null) {
  if (!countryCode) {
    return null;
  }

  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode.toUpperCase()) ?? null;
  } catch {
    return null;
  }
}

export function detectCountryFromNames(
  countries: CountryOption[],
  countryName: string | null,
  countryCode: string | null,
) {
  const normalizedBySlug = new Map(countries.map((country) => [country.slug, country]));
  const normalizedByName = new Map(
    countries.map((country) => [country.name.toLowerCase(), country]),
  );
  const regionName = resolveCountryNameFromIsoCode(countryCode);
  const candidates = [countryName, regionName].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const candidate of candidates) {
    const byName = normalizedByName.get(candidate.toLowerCase().trim());
    if (byName) {
      return byName;
    }

    const bySlug = normalizedBySlug.get(slugify(candidate));
    if (bySlug) {
      return bySlug;
    }
  }

  return null;
}
