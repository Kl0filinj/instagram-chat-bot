import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({
    where: {
      id: {
        not: '922129809859449',
      },
    },
  });
  const generateMockUsers = (count: number): any[] => {
    const sexOptions: ('male' | 'female' | 'none')[] = [
      'male',
      'female',
      'none',
    ];
    const cities = ['New York', 'London', 'Vienna'];

    return Array.from({ length: count }, (_, index) => ({
      id: String(index),
      age: Math.floor(Math.random() * (22 - 18 + 1)) + 18,
      sex: sexOptions[Math.floor(Math.random() * sexOptions.length)],
      sexInterest: sexOptions[Math.floor(Math.random() * sexOptions.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      name: `User ${index + 1}`,
      bio: `This is the bio for User ${index + 1}`,
      avatarUrl: `https://picsum.photos/id/${Math.floor(
        Math.random() * 1000,
      )}/300/300`,
    }));
  };

  await prisma.user.createMany({
    data: generateMockUsers(1000),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
