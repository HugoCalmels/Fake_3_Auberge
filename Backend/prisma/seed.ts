import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import { Pool } from "pg";
import {
  MealPlanCode,
  PrismaClient,
} from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("Seeding...");

  await prisma.booking.deleteMany();
  await prisma.roomTypeMealPlan.deleteMany();
  await prisma.room.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.adminUser.deleteMany();

  await prisma.adminUser.create({
    data: {
      email: "owner@auberge.com",
      passwordHash: await bcrypt.hash("admin123456", 10),
    },
  });

  const roomOnly = await prisma.mealPlan.create({
    data: {
      code: MealPlanCode.room_only,
      name: "Chambre seule",
      adultPrice: 0,
      childPrice: 0,
    },
  });

  const halfBoard = await prisma.mealPlan.create({
    data: {
      code: MealPlanCode.half_board,
      name: "Demi-pension",
      adultPrice: 18,
      childPrice: 12,
    },
  });

  const fullBoard = await prisma.mealPlan.create({
    data: {
      code: MealPlanCode.full_board,
      name: "Pension complète",
      adultPrice: 32,
      childPrice: 22,
    },
  });

  const types = await Promise.all([
    prisma.roomType.create({
      data: {
        code: "chambre_double",
        name: "Chambre double",
        maxCapacity: 2,
        basePrice: 85,
        description:
          "Lit double, vue montagne, sanitaires équipés de douche et WC, draps compris.",
        imageUrl: "/rooms/bed-1.jpg",
      },
    }),

    prisma.roomType.create({
      data: {
        code: "chambre_twin",
        name: "Chambre twin",
        maxCapacity: 2,
        basePrice: 75,
        description:
          "Deux lits simples, vue montagne, sanitaires équipés de douche et WC, draps compris.",
        imageUrl: "/rooms/bed-2.jpg",
      },
    }),

    prisma.roomType.create({
      data: {
        code: "chambre_quadruple",
        name: "Chambre quadruple",
        maxCapacity: 4,
        basePrice: 120,
        description:
          "Chambre pour quatre personnes, idéale famille ou groupe, sanitaires équipés.",
        imageUrl: "/rooms/bed-3.jpg",
      },
    }),

    prisma.roomType.create({
      data: {
        code: "chambre_familiale",
        name: "Chambre familiale",
        maxCapacity: 5,
        basePrice: 140,
        description:
          "Chambre familiale avec un lit double et plusieurs couchages simples.",
        imageUrl: "/rooms/bed-4.jpg",
      },
    }),

    prisma.roomType.create({
      data: {
        code: "chambre_5_places",
        name: "Chambre 5 places",
        maxCapacity: 5,
        basePrice: 130,
        description:
          "Chambre cinq places avec lits simples, adaptée aux groupes et familles.",
        imageUrl: "/rooms/bed-5.jpg",
      },
    }),
  ]);

  for (const type of types) {
    await prisma.roomTypeMealPlan.createMany({
      data: [roomOnly, halfBoard, fullBoard].map((mealPlan) => ({
        roomTypeId: type.id,
        mealPlanId: mealPlan.id,
      })),
    });
  }

  await prisma.room.createMany({
    data: [
      { number: "101", floor: 1, roomTypeId: types[0].id },
      { number: "102", floor: 1, roomTypeId: types[0].id },
      { number: "103", floor: 1, roomTypeId: types[0].id },

      ...Array.from({ length: 16 }, (_, index) => ({
        number: `${201 + index}`,
        floor: 2,
        roomTypeId: types[1].id,
      })),

      { number: "301", floor: 3, roomTypeId: types[2].id },
      { number: "302", floor: 3, roomTypeId: types[3].id },
      { number: "303", floor: 3, roomTypeId: types[4].id },
    ],
  });

  const room = await prisma.room.findFirstOrThrow({
    where: { number: "101" },
  });

  const nights = 2;
  const roomPrice = 85 * nights;
  const mealPrice = 18 * 2 * nights;

  await prisma.booking.create({
    data: {
      roomId: room.id,
      mealPlanId: halfBoard.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 86400000),
      persons: 2,
      adultMeals: 2,
      childMeals: 0,
      guestName: "Jean Dupont",
      guestEmail: "jean@example.com",
      roomPrice,
      mealPlanPrice: mealPrice,
      totalPrice: roomPrice + mealPrice,
    },
  });

  console.log("Seed done");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });