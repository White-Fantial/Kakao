import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

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
  { name: '궁금해요', slug: 'question', type: CategoryType.QUESTION },
  { name: '도와주세요', slug: 'help', type: CategoryType.HELP },
  { name: '팔아요', slug: 'sale', type: CategoryType.SALE },
  { name: '무료나눔', slug: 'giveaway', type: CategoryType.GIVEAWAY },
];

function slugifyCity(city) {
  return city.toLowerCase().replace(/\s+/g, '-');
}

async function main() {
  await Promise.all(
    cities.map((name, index) =>
      prisma.city.upsert({
        where: { slug: slugifyCity(name) },
        update: { name, isActive: true, sortOrder: index },
        create: {
          name,
          slug: slugifyCity(name),
          isActive: true,
          sortOrder: index,
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
        },
        create: {
          ...category,
          isActive: true,
          sortOrder: index,
        },
      }),
    ),
  );

  console.log('✅ Seed complete: cities and categories inserted/updated.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
