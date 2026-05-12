import { PrismaClient, CategoryType, CategoryVisibilityMode, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const countries = [{ name: 'New Zealand', slug: 'new-zealand' }];

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
  {
    name: '공지사항',
    slug: 'notice',
    type: CategoryType.GENERAL,
    visibilityMode: CategoryVisibilityMode.ALWAYS_INCLUDED,
  },
  {
    name: '광고',
    slug: 'ad',
    type: CategoryType.GENERAL,
    visibilityMode: CategoryVisibilityMode.ALWAYS_INCLUDED,
  },
  {
    name: '사고팔아요',
    slug: 'buy-sell',
    type: CategoryType.SALE,
    visibilityMode: CategoryVisibilityMode.NORMAL,
  },
  {
    name: '무료나눔',
    slug: 'free-share',
    type: CategoryType.GIVEAWAY,
    visibilityMode: CategoryVisibilityMode.NORMAL,
  },
  {
    name: '궁금해요',
    slug: 'question',
    type: CategoryType.QUESTION,
    visibilityMode: CategoryVisibilityMode.NORMAL,
  },
  {
    name: '도와주세요',
    slug: 'help',
    type: CategoryType.HELP,
    visibilityMode: CategoryVisibilityMode.NORMAL,
  },
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
          visibilityMode: category.visibilityMode,
          isActive: true,
          sortOrder: index,
        },
        create: {
          name: category.name,
          slug: category.slug,
          type: category.type,
          visibilityMode: category.visibilityMode,
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

  const adminKakaoId = process.env.ADMIN_KAKAO_ID ?? 'seed-admin-placeholder';
  const adminDisplayName = process.env.ADMIN_DISPLAY_NAME ?? 'nomadongho';
  const profileImageUrl = process.env.ADMIN_PROFILE_IMAGE_URL ?? null;
  await prisma.user.upsert({
    where: { kakaoId: adminKakaoId },
    update: { role: UserRole.ADMIN },
    create: {
      kakaoId: adminKakaoId,
      displayName: adminDisplayName,
      profileImageUrl,
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
