import { PrismaClient } from '@prisma/client';
import { cities } from './data';

const prisma = new PrismaClient();

async function main() {
  // await prisma.user.deleteMany({
  //   where: {
  //     id: {
  //       notIn: [
  //         '1109348780564816',
  //         '1300318520990220',
  //         '1614085839501244',
  //         '922129809859449',
  //       ],
  //     },
  //   },
  // });
  // const generateMockUsers = (count: number): any[] => {
  //   const sexOptions: ('male' | 'female' | 'none')[] = [
  //     'male',
  //     'female',
  //     'none',
  //   ];
  //   const cities = ['London', 'Linz', 'Vienna'];
  //   return Array.from({ length: count }, (_, index) => ({
  //     id: String(index),
  //     age: Math.floor(Math.random() * (22 - 18 + 1)) + 18,
  //     sex: sexOptions[Math.floor(Math.random() * sexOptions.length)],
  //     sexInterest: sexOptions[Math.floor(Math.random() * sexOptions.length)],
  //     city: cities[Math.floor(Math.random() * cities.length)],
  //     name: `User ${index + 1}`,
  //     bio: `This is the bio for User ${index + 1}`,
  //     avatarUrl: `https://picsum.photos/id/${Math.floor(
  //       Math.random() * 1000,
  //     )}/300/300`,
  //   }));
  // };
  // await prisma.user.createMany({
  //   data: generateMockUsers(100),
  // });
  //*** Cities seed
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const cityEntity = {
      name: city.name,
      lat: city.lat,
      lng: city.lng,
      country: city.country,
      admin1: city.admin1 ?? '',
      admin2: city.admin2 ?? '',
    };
    await prisma.city.upsert({
      where: {
        name: city.name,
      },
      create: cityEntity,
      update: cityEntity,
    });
  }
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
