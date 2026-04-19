import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST!,
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRaw`ALTER TABLE restaurant AUTO_INCREMENT = 100`;
  // Seed product types
  const foodType = await prisma.productType.create({
    data: { name: "Food", description: "Food items" },
  });
  const beverageType = await prisma.productType.create({
    data: { name: "Beverage", description: "Drink items" },
  });

  // Seed restaurant
  await prisma.restaurant.create({
    data: {
      phoneNumber: "555-123-4567",
      name: "Claude's Kitchen",
      addressId: 1,
    },
  });

  // Seed products
  const burger = await prisma.orderableItem.create({
    data: {
      itemType: "product",
      product: {
        create: {
          name: "Cheeseburger",
          basePrice: 8.99,
          typeId: foodType.typeId,
        },
      },
    },
    include: { product: true },
  });

  const fries = await prisma.orderableItem.create({
    data: {
      itemType: "product",
      product: {
        create: {
          name: "French Fries",
          basePrice: 3.99,
          typeId: foodType.typeId,
        },
      },
    },
    include: { product: true },
  });

  const soda = await prisma.orderableItem.create({
    data: {
      itemType: "product",
      product: {
        create: {
          name: "Soda",
          basePrice: 1.99,
          typeId: beverageType.typeId,
        },
      },
    },
    include: { product: true },
  });

  // Seed a combo package
  await prisma.orderableItem.create({
    data: {
      itemType: "package",
      package: {
        create: {
          name: "Combo Meal",
          bundlePrice: 12.99,
          packageProducts: {
            create: [
              { productId: burger.product!.productId },
              { productId: fries.product!.productId },
              { productId: soda.product!.productId },
            ],
          },
        },
      },
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());