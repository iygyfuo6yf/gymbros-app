import { prisma } from './prisma.js';
import { exerciseLibrarySeed, gymsSeed, routineTemplatesSeed, sampleMealsSeed } from '../seed/data.js';

export async function ensureSeedData() {
  for (const exercise of exerciseLibrarySeed) {
    await prisma.exercise.upsert({
      where: { id: exercise.id },
      create: exercise,
      update: exercise
    });
  }

  for (const gym of gymsSeed) {
    await prisma.gym.upsert({
      where: { id: gym.id },
      create: gym,
      update: gym
    });
  }

  for (const template of routineTemplatesSeed) {
    await prisma.routineTemplate.upsert({
      where: { id: template.id },
      create: {
        id: template.id,
        goal: template.goal,
        name: template.name,
        exercises: JSON.stringify(template.exercises)
      },
      update: {
        goal: template.goal,
        name: template.name,
        exercises: JSON.stringify(template.exercises)
      }
    });
  }

  // Keep sample meals available as lightweight fallback recommendations.
  void sampleMealsSeed;

}
