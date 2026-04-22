import { prisma } from '../src/lib/prisma.js';
import { ensureSeedData } from '../src/lib/bootstrap.js';

export async function resetStore() {
  await prisma.watchWorkoutSnapshot.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.routineEntry.deleteMany();
  await prisma.workoutRoutine.deleteMany();
  await prisma.workoutSetLog.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.mealPhoto.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await ensureSeedData();
}
