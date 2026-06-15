import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import {
  BookingSource,
  BookingStatus,
  MealPlanCode,
  PaymentStatus,
  PrismaClient,
} from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DAY = 86_400_000;

function atNoon(date: Date) {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  return atNoon(new Date(date.getTime() + days * DAY));
}

function emailFromName(name: string) {
  return `${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(" ", ".")}@example.com`;
}

async function main() {
  console.log("Seeding...");

  await prisma.invoice.deleteMany();
  await prisma.systemLog.deleteMany();
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

  const rooms = await prisma.room.findMany({
    include: {
      roomType: true,
    },
    orderBy: {
      number: "asc",
    },
  });

  const guests = [
    "Jean Dupont",
    "Marie Bernard",
    "Lucas Moreau",
    "Camille Petit",
    "Thomas Garnier",
    "Nina Roux",
    "Paul Martin",
    "Sophie Leroy",
    "Hugo Blanc",
    "Claire Dubois",
    "Antoine Mercier",
    "Julie Fontaine",
    "Maxime Girard",
    "Laura Simon",
    "Nicolas Perrin",
    "Emma Robert",
    "Adrien Faure",
    "Manon Chevalier",
    "Romain Lambert",
    "Chloé Masson",
    "Baptiste Robin",
    "Sarah Gauthier",
    "Alexandre Marchand",
    "Léa Colin",
  ];

  const mealPlans = [roomOnly, halfBoard, fullBoard];
  const today = atNoon(new Date());

  let invoiceIndex = 1;
  let createdBookings = 0;

  const demoBookings = Array.from({ length: 72 }, (_, index) => {
    const room = rooms[index % rooms.length];
    const startOffset = -28 + index * 2;
    const nights = 1 + (index % 4);
    const guestName = guests[index % guests.length];
    const mealPlan = mealPlans[index % mealPlans.length];

    let status: BookingStatus = BookingStatus.confirmed;

    if (startOffset < -7) {
      status = BookingStatus.checked_out;
    } else if (startOffset < 0) {
      status = index % 5 === 0 ? BookingStatus.no_show : BookingStatus.checked_out;
    } else if (startOffset === 0 || startOffset === 1) {
      status = BookingStatus.checked_in;
    } else if (index % 17 === 0) {
      status = BookingStatus.cancelled;
    }

    const paymentStatus =
      status === BookingStatus.cancelled || status === BookingStatus.no_show
        ? PaymentStatus.unpaid
        : index % 4 === 0
          ? PaymentStatus.unpaid
          : PaymentStatus.paid;

    return {
      room,
      startDate: addDays(today, startOffset),
      endDate: addDays(today, startOffset + nights),
      nights,
      guestName,
      guestEmail: emailFromName(guestName),
      guestPhone: `06${String(10000000 + index * 13791).slice(0, 8)}`,
      mealPlan,
      status,
      paymentStatus,
      notes:
        index % 9 === 0
          ? "Arrivée tardive prévue, prévenir l'accueil."
          : index % 13 === 0
            ? "Client habitué, préfère une chambre calme."
            : null,
    };
  });

  for (const item of demoBookings) {
    const adults = Math.min(2, item.room.roomType.maxCapacity);
    const children = item.room.roomType.maxCapacity >= 4 && createdBookings % 3 === 0 ? 1 : 0;
    const persons = adults + children;

    const roomPrice = item.room.roomType.basePrice * item.nights;
    const mealPlanPrice =
      (item.mealPlan.adultPrice * adults + item.mealPlan.childPrice * children) *
      item.nights;
    const totalPrice = roomPrice + mealPlanPrice;

    const bookingGroupId = randomUUID();
    const stripePaymentIntentId =
      item.paymentStatus === PaymentStatus.paid
        ? `pi_demo_${String(createdBookings + 1).padStart(6, "0")}`
        : null;

    const booking = await prisma.booking.create({
      data: {
        bookingGroupId,

        roomId: item.room.id,
        mealPlanId: item.mealPlan.id,

        startDate: item.startDate,
        endDate: item.endDate,

        persons,
        adultMeals: adults,
        childMeals: children,

        status: item.status,
        bookingSource:
          createdBookings % 5 === 0
            ? BookingSource.admin_manual
            : BookingSource.website,

        paymentStatus: item.paymentStatus,
        stripePaymentIntentId,

        guestName: item.guestName,
        guestEmail: item.guestEmail,
        guestPhone: item.guestPhone,
        notes: item.notes,

        roomPrice,
        mealPlanPrice,
        totalPrice,
      },
    });

    if (
      item.paymentStatus === PaymentStatus.paid &&
      item.status !== BookingStatus.cancelled &&
      item.status !== BookingStatus.no_show
    ) {
      const year = item.startDate.getFullYear();
      const invoiceNumber = `FAC-${year}-${String(invoiceIndex).padStart(6, "0")}`;

      await prisma.invoice.create({
        data: {
          number: invoiceNumber,
          bookingGroupId,
          stripePaymentIntentId: stripePaymentIntentId ?? undefined,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          totalPrice: booking.totalPrice,
        },
      });

      invoiceIndex++;
    }

    createdBookings++;
  }

  console.log(`Seed done: ${createdBookings} bookings created.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });