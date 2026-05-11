import { PrismaClient, CategoryType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const countries = [
  { name: 'New Zealand', slug: 'new-zealand' },
];

const cities = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Dunedin',
  'Queenstown',
  'Nelson',
  'Rotorua',
  'Invercargill',
  'Other',
];

const categories = [
  { name: '공지사항', slug: 'notice', type: CategoryType.GENERAL, minRole: UserRole.COORDINATOR, isAlwaysIncluded: true, ignoreCity: true, supportsAllCities: false, ignoreCountry: true },
  { name: '피쳐드', slug: 'featured', type: CategoryType.GENERAL, minRole: UserRole.COORDINATOR, isAlwaysIncluded: true, ignoreCity: false, supportsAllCities: true, ignoreCountry: false },
  { name: '궁금해요', slug: 'question', type: CategoryType.QUESTION, minRole: UserRole.USER, isAlwaysIncluded: false, ignoreCity: false, supportsAllCities: false, ignoreCountry: false },
  { name: '도와주세요', slug: 'help', type: CategoryType.HELP, minRole: UserRole.USER, isAlwaysIncluded: false, ignoreCity: false, supportsAllCities: false, ignoreCountry: false },
  { name: '팔아요', slug: 'sale', type: CategoryType.SALE, minRole: UserRole.USER, isAlwaysIncluded: false, ignoreCity: false, supportsAllCities: false, ignoreCountry: false },
  { name: '구인구직', slug: 'recruit', type: CategoryType.RECRUIT, minRole: UserRole.USER, isAlwaysIncluded: false, ignoreCity: false, supportsAllCities: false, ignoreCountry: false },
  { name: '무료나눔', slug: 'giveaway', type: CategoryType.GIVEAWAY, minRole: UserRole.USER, isAlwaysIncluded: false, ignoreCity: false, supportsAllCities: false, ignoreCountry: false },
];

const reportOptions = [
  '사기/거래 위험',
  '욕설/혐오/괴롭힘',
  '음란/부적절한 콘텐츠',
  '광고/스팸',
  '개인정보 노출',
  '기타',
];

function slugifyCity(city) {
  return city.toLowerCase().replace(/\s+/g, '-');
}

async function main() {
  // Upsert countries
  const countryRecords = {};
  for (const [index, country] of countries.entries()) {
    const record = await prisma.country.upsert({
      where: { slug: country.slug },
      update: { name: country.name, isActive: true, sortOrder: index },
      create: {
        name: country.name,
        slug: country.slug,
        isActive: true,
        sortOrder: index,
      },
    });
    countryRecords[country.slug] = record;
  }

  const nzId = countryRecords['new-zealand'].id;

  // Upsert cities and assign to New Zealand
  await Promise.all(
    cities.map((name, index) =>
      prisma.city.upsert({
        where: { slug: slugifyCity(name) },
        update: { name, isActive: true, sortOrder: index, countryId: nzId },
        create: {
          name,
          slug: slugifyCity(name),
          isActive: true,
          sortOrder: index,
          countryId: nzId,
        },
      }),
    ),
  );

  await Promise.all(
    categories.map((category, index) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          type: category.type,
          isActive: true,
          sortOrder: index,
          minRole: category.minRole,
          isAlwaysIncluded: category.isAlwaysIncluded,
          ignoreCity: category.ignoreCity,
          supportsAllCities: category.supportsAllCities,
          ignoreCountry: category.ignoreCountry,
        },
        create: {
          ...category,
          isActive: true,
          sortOrder: index,
        },
      }),
    ),
  );

  await Promise.all(
    reportOptions.map((label, index) =>
      prisma.reportOption.upsert({
        where: { label },
        update: { isActive: true, sortOrder: index },
        create: { label, isActive: true, sortOrder: index },
      }),
    ),
  );

  // Admin user seed — for local / staging use only.
  // kakaoId is a dev placeholder; replace it with the real Kakao numeric ID
  // (via prisma studio or a one-off query) after the admin first logs in via Kakao OAuth.
  // Set ADMIN_KAKAO_ID env var to override the placeholder in other environments.
  const adminKakaoId = process.env.ADMIN_KAKAO_ID ?? 'seed-admin-placeholder';
  const adminDisplayName = process.env.ADMIN_DISPLAY_NAME ?? 'nomadongho';
  const profileImageUrl = process.env.ADMIN_PROFILE_IMAGE_URL ?? null;
  await prisma.user.upsert({
    where: { kakaoId: adminKakaoId },
    update: { role: UserRole.ADMIN },
    create: {
      kakaoId: adminKakaoId,
      displayName: adminDisplayName,
      profileImageUrl: profileImageUrl,
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Seed complete: countries, cities, categories, and admin user inserted/updated.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

