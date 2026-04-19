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

  // ── Addresses ─────────────────────────────────────────────────────────────
  const restaurantAddress = await prisma.address.create({
    data: {
      line1: "123 Main St",
      city: "Oakland",
      state: "CA",
      country: "US",
      postalCode: "94601",
    },
  });

  const aliceAddress = await prisma.address.create({
    data: {
      line1: "456 Oak Ave",
      city: "Oakland",
      state: "CA",
      country: "US",
      postalCode: "94602",
    },
  });

  const bobAddress = await prisma.address.create({
    data: {
      line1: "789 Pine Rd",
      city: "Oakland",
      state: "CA",
      country: "US",
      postalCode: "94603",
    },
  });

  const carolAddress = await prisma.address.create({
    data: {
      line1: "321 Elm St",
      city: "Oakland",
      state: "CA",
      country: "US",
      postalCode: "94604",
    },
  });

  // ── Restaurant ────────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.create({
    data: {
      phoneNumber: "555-123-4567",
      name: "Claude's Kitchen",
      addressId: restaurantAddress.addressId,
    },
  });

  // ── Product types ─────────────────────────────────────────────────────────
  const foodType = await prisma.productType.create({
    data: { name: "Food", description: "Food items" },
  });

  const beverageType = await prisma.productType.create({
    data: { name: "Beverage", description: "Drink items" },
  });

  // ── Products ──────────────────────────────────────────────────────────────
  const burgerItem = await prisma.orderableItem.create({
    data: {
      itemType: "product",
      product: { create: { name: "Cheeseburger", basePrice: 8.99, typeId: foodType.typeId } },
    },
    include: { product: true },
  });

  const friesItem = await prisma.orderableItem.create({
    data: {
      itemType: "product",
      product: { create: { name: "French Fries", basePrice: 3.99, typeId: foodType.typeId } },
    },
    include: { product: true },
  });

  const sodaItem = await prisma.orderableItem.create({
    data: {
      itemType: "product",
      product: { create: { name: "Soda", basePrice: 1.99, typeId: beverageType.typeId } },
    },
    include: { product: true },
  });

  const onionRingsItem = await prisma.orderableItem.create({
    data: {
      itemType: "product",
      product: { create: { name: "Onion Rings", basePrice: 4.49, typeId: foodType.typeId } },
    },
    include: { product: true },
  });

  const milkshakeItem = await prisma.orderableItem.create({
    data: {
      itemType: "product",
      product: { create: { name: "Milkshake", basePrice: 4.99, typeId: beverageType.typeId } },
    },
    include: { product: true },
  });

  const burger = burgerItem.product!;
  const fries = friesItem.product!;
  const soda = sodaItem.product!;
  const onionRings = onionRingsItem.product!;
  const milkshake = milkshakeItem.product!;

  // ── Packages ──────────────────────────────────────────────────────────────
  const comboItem = await prisma.orderableItem.create({
    data: {
      itemType: "package",
      package: {
        create: {
          name: "Combo Meal",
          bundlePrice: 12.99,
          packageProducts: {
            create: [
              { productId: burger.productId },
              { productId: fries.productId },
              { productId: soda.productId },
            ],
          },
        },
      },
    },
  });

  await prisma.orderableItem.create({
    data: {
      itemType: "package",
      package: {
        create: {
          name: "Rings & Shake",
          bundlePrice: 8.49,
          packageProducts: {
            create: [
              { productId: onionRings.productId },
              { productId: milkshake.productId },
            ],
          },
        },
      },
    },
  });

  // ── Inventory ─────────────────────────────────────────────────────────────
  for (const [productId, qty] of [
    [burger.productId, 50],
    [fries.productId, 100],
    [soda.productId, 80],
    [onionRings.productId, 60],
    [milkshake.productId, 40],
  ] as [number, number][]) {
    await prisma.inventoryTransaction.create({
      data: { productId, quantityChange: qty, reason: "initial_stock" },
    });
  }

  // ── Roles ─────────────────────────────────────────────────────────────────
  const managerRole = await prisma.role.create({
    data: { name: "Manager", description: "Oversees daily operations" },
  });

  const cashierRole = await prisma.role.create({
    data: { name: "Cashier", description: "Handles customer orders and payments" },
  });

  const cookRole = await prisma.role.create({
    data: { name: "Cook", description: "Prepares food orders" },
  });

  // ── Employees ─────────────────────────────────────────────────────────────
  const alice = await prisma.employee.create({
    data: {
      firstName: "Alice",
      lastName: "Johnson",
      dateOfBirth: new Date("1990-03-15"),
      storeNumber: restaurant.storeNumber,
      salary: 55000,
      hireDate: new Date("2022-01-10"),
      addressId: aliceAddress.addressId,
      employeeRoles: {
        create: [{ roleId: managerRole.roleId }, { roleId: cashierRole.roleId }],
      },
    },
  });

  const bob = await prisma.employee.create({
    data: {
      firstName: "Bob",
      lastName: "Martinez",
      dateOfBirth: new Date("1995-07-22"),
      storeNumber: restaurant.storeNumber,
      salary: 38000,
      hireDate: new Date("2023-03-05"),
      addressId: bobAddress.addressId,
      employeeRoles: {
        create: [{ roleId: cookRole.roleId }],
      },
    },
  });

  const carol = await prisma.employee.create({
    data: {
      firstName: "Carol",
      lastName: "Lee",
      dateOfBirth: new Date("1998-11-30"),
      storeNumber: restaurant.storeNumber,
      salary: 36000,
      hireDate: new Date("2023-06-20"),
      addressId: carolAddress.addressId,
      employeeRoles: {
        create: [{ roleId: cashierRole.roleId }],
      },
    },
  });

  // ── Shifts ────────────────────────────────────────────────────────────────
  await prisma.shift.create({
    data: {
      employeeId: alice.employeeId,
      roleId: managerRole.roleId,
      startTimestamp: new Date("2026-04-18T08:00:00"),
      endTimestamp: new Date("2026-04-18T16:00:00"),
      clockInTimestamp: new Date("2026-04-18T07:58:00"),
      clockOutTimestamp: new Date("2026-04-18T16:03:00"),
    },
  });

  await prisma.shift.create({
    data: {
      employeeId: bob.employeeId,
      roleId: cookRole.roleId,
      startTimestamp: new Date("2026-04-18T09:00:00"),
      endTimestamp: new Date("2026-04-18T17:00:00"),
      clockInTimestamp: new Date("2026-04-18T09:01:00"),
      clockOutTimestamp: new Date("2026-04-18T17:05:00"),
    },
  });

  await prisma.shift.create({
    data: {
      employeeId: carol.employeeId,
      roleId: cashierRole.roleId,
      startTimestamp: new Date("2026-04-18T10:00:00"),
      endTimestamp: new Date("2026-04-18T18:00:00"),
      clockInTimestamp: new Date("2026-04-18T10:00:00"),
    },
  });

  // ── Discounts ─────────────────────────────────────────────────────────────
  const tenPercent = await prisma.discount.create({
    data: { name: "10% Off", value: 10.0, type: "percent" },
  });

  const fiveDollars = await prisma.discount.create({
    data: { name: "$5 Off", value: 5.0, type: "fixed" },
  });

  // ── Orders ────────────────────────────────────────────────────────────────
  // Order 1: cash-paid cheeseburger + fries + soda
  const order1Subtotal = 8.99 + 3.99 + 1.99; // 14.97
  const order1Tax = order1Subtotal * 0.0875;
  const order1Total = order1Subtotal + order1Tax;

  const order1 = await prisma.order.create({
    data: {
      customerName: "Jane Smith",
      storeNumber: restaurant.storeNumber,
      taxPercent: 8.75,
      tip: 2.00,
      subtotal: order1Subtotal,
      total: order1Total + 2.00,
      preparationStatus: "completed",
      paymentStatus: "paid",
      employeeId: carol.employeeId,
      orderItems: {
        create: [
          { itemId: burgerItem.itemId, quantity: 1, priceAtPurchase: 8.99 },
          { itemId: friesItem.itemId,  quantity: 1, priceAtPurchase: 3.99 },
          { itemId: sodaItem.itemId,   quantity: 1, priceAtPurchase: 1.99 },
        ],
      },
    },
  });

  // Order 2: onion rings x2 with a $5 discount, partially paid
  const order2Subtotal = 4.49 * 2; // 8.98
  const order2Tax = order2Subtotal * 0.0875;
  const order2Total = order2Subtotal + order2Tax - 5.0;

  const order2 = await prisma.order.create({
    data: {
      customerName: "Tom Baker",
      storeNumber: restaurant.storeNumber,
      taxPercent: 8.75,
      subtotal: order2Subtotal,
      total: order2Total,
      preparationStatus: "in_progress",
      paymentStatus: "unpaid",
      employeeId: carol.employeeId,
      orderItems: {
        create: [
          { itemId: onionRingsItem.itemId, quantity: 2, priceAtPurchase: 4.49 },
        ],
      },
      orderDiscounts: {
        create: [{ discountId: fiveDollars.discountId }],
      },
    },
  });

  // Order 3: pending, no payment yet — one Combo Meal with 10% discount
  const order3Subtotal = 12.99;
  const order3PreTaxTotal = order3Subtotal + order3Subtotal * 0.0875;
  const order3DiscountAmount = order3Subtotal * (10 / 100);
  const order3Total = order3PreTaxTotal - order3DiscountAmount;

  const order3 = await prisma.order.create({
    data: {
      customerName: "Sam Rivera",
      storeNumber: restaurant.storeNumber,
      taxPercent: 8.75,
      subtotal: order3Subtotal,
      total: order3Total,
      preparationStatus: "pending",
      paymentStatus: "unpaid",
      orderItems: {
        create: [
          { itemId: comboItem.itemId, quantity: 1, priceAtPurchase: 12.99 },
        ],
      },
      orderDiscounts: {
        create: [{ discountId: tenPercent.discountId }],
      },
    },
  });

  // ── Payments ──────────────────────────────────────────────────────────────
  // Cash payment covering order 1 in full
  await prisma.payment.create({
    data: { orderId: order1.orderId, type: "cash", amount: order1Total + 2.00 },
  });

  // Partial card payment on order 2
  const card = await prisma.card.create({
    data: {
      cardholderName: "Tom Baker",
      token: "tok_test_4242424242424242",
      lastFour: "4242",
      brand: "Visa",
      expirationMonth: 12,
      expirationYear: 2027,
    },
  });

  const cardPayment = await prisma.payment.create({
    data: { orderId: order2.orderId, type: "card", amount: 3.00 },
  });

  await prisma.electronicPayment.create({
    data: { cardId: card.cardId, paymentId: cardPayment.paymentId },
  });

  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
