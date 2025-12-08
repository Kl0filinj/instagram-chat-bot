import { PrismaClient } from '@prisma/client';
import { cities } from './data';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const seedCities = async () => {
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
};

// const seedUsers = async () => {
//   const mockCities = [
//     'Istanbul',
//     'London',
//     'Paris',
//     'Berlin',
//     'Amsterdam',
//     'New York',
//     'Vienna',
//     'Barcelona',
//   ];

//   // TODO: Comment it before push
//   // await prisma.user.deleteMany({
//   //   where: {
//   //     id: {
//   //       notIn: ['922129809859449'],
//   //     },
//   //   },
//   // });

//   for (const city of mockCities) {
//     const countOfUsers = await prisma.user.count({
//       where: {
//         city,
//       },
//     });

//     if (countOfUsers >= 30) {
//       continue;
//     }

//     const users = Array.from({ length: 30 }, () => {
//       const sex = faker.helpers.arrayElement(['male', 'female']);
//       const sexInterest = faker.helpers.arrayElement([
//         'male',
//         'female',
//         'none',
//       ]);

//       return {
//         id: randomUUID(),
//         name: `${faker.person.firstName()} ${faker.person.lastName()}`,
//         age: faker.number.int({ min: 18, max: 23 }),
//         sex,
//         sexInterest,
//         city: city,
//         bio: faker.lorem.sentence({ max: 10, min: 5 }),
//         avatarUrl: faker.image.avatar(), // or null
//         isRegistered: true,
//         localizationLang: 'en',
//       };
//     });

//     await prisma.user.createMany({
//       data: users,
//       skipDuplicates: true,
//     });
//   }
// };

async function main() {
  //*** Cities seed
  await seedCities();

  //*** Test users seed
  // await seedUsers();
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
