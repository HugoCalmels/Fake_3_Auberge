import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import {
  BookingStatus,
  MealPlanCode,
  PrismaClient,
  RoomStatus,
  RoomTypeCode,
} from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("🌱 Seeding...");

  await prisma.booking.deleteMany();
  await prisma.roomTypeMealPlan.deleteMany();
  await prisma.room.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.adminUser.deleteMany();

  // ADMIN
  await prisma.adminUser.create({
    data: {
      email: "owner@auberge.com",
      passwordHash: await bcrypt.hash("admin123456", 10),
    },
  });

  // MEAL PLANS
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

  // ROOM TYPES
  const types = await Promise.all([
    prisma.roomType.create({
      data: {
        code: RoomTypeCode.double,
        name: "Chambre double",
        maxCapacity: 2,
        basePrice: 85,
        description: "Lit double, vue montagne...",
      },
    }),
    prisma.roomType.create({
      data: {
        code: RoomTypeCode.twin,
        name: "Chambre twin",
        maxCapacity: 2,
        basePrice: 75,
        description: "2 lits simples...",
      },
    }),
    prisma.roomType.create({
      data: {
        code: RoomTypeCode.quadruple,
        name: "Chambre quadruple",
        maxCapacity: 4,
        basePrice: 120,
        description: "4 lits...",
      },
    }),
    prisma.roomType.create({
      data: {
        code: RoomTypeCode.familiale,
        name: "Chambre familiale",
        maxCapacity: 5,
        basePrice: 140,
        description: "1 double + 3 simples...",
      },
    }),
    prisma.roomType.create({
      data: {
        code: RoomTypeCode.cinq_places,
        name: "Chambre 5 places",
        maxCapacity: 5,
        basePrice: 130,
        description: "5 lits simples...",
      },
    }),
  ]);

  // LINK MEALS
  for (const type of types) {
    await prisma.roomTypeMealPlan.createMany({
      data: [roomOnly, halfBoard, fullBoard].map((m) => ({
        roomTypeId: type.id,
        mealPlanId: m.id,
      })),
    });
  }

  // ROOMS
  await prisma.room.createMany({
    data: [
      { number: "101", floor: 1, roomTypeId: types[0].id },
      { number: "102", floor: 1, roomTypeId: types[0].id },
      { number: "103", floor: 1, roomTypeId: types[0].id },

      ...Array.from({ length: 16 }, (_, i) => ({
        number: `${201 + i}`,
        floor: 2,
        roomTypeId: types[1].id,
      })),

      { number: "301", floor: 3, roomTypeId: types[2].id },
      { number: "302", floor: 3, roomTypeId: types[3].id },
      { number: "303", floor: 3, roomTypeId: types[4].id },
    ],
  });

  // DEMO BOOKING
  const room = await prisma.room.findFirstOrThrow();

  const nights = 2;
  const persons = 2;
  const adultMeals = 2;
  const childMeals = 0;

  const roomPrice = 85 * nights;
  const mealPrice = 18 * adultMeals * nights;

  await prisma.booking.create({
    data: {
      roomId: room.id,
      mealPlanId: halfBoard.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 86400000),

      persons,
      adultMeals,
      childMeals,

      guestName: "Jean Dupont",
      guestEmail: "jean@example.com",

      roomPrice,
      mealPlanPrice: mealPrice,
      totalPrice: roomPrice + mealPrice,
    },
  });

  console.log("✅ Seed done");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });