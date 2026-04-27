import { prisma } from '../lib/prisma.js';
import { exerciseLibrarySeed, gymsSeed, routineTemplatesSeed } from './data.js';

async function main() {
  await prisma.exercise.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.routineTemplate.deleteMany();

  await prisma.exercise.createMany({ data: exerciseLibrarySeed });
  await prisma.gym.createMany({ data: gymsSeed });
  await prisma.routineTemplate.createMany({
    data: routineTemplatesSeed.map((template) => ({
      id: template.id,
      goal: template.goal,
      name: template.name,
      exercises: JSON.stringify(template.exercises)
    }))
  });

  // eslint-disable-next-line no-console
  console.log('Seeded exercises, gyms, and routine templates.');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
