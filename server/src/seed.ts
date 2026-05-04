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

  // ── Addresses (13 total) ──────────────────────────────────────────────────
  const restaurantAddress = await prisma.address.create({
    data: { line1: "123 Main St", city: "Oakland", state: "CA", country: "US", postalCode: "94601" },
  });
  const addr2 = await prisma.address.create({
    data: { line1: "456 Oak Ave", city: "Oakland", state: "CA", country: "US", postalCode: "94602" },
  });
  const addr3 = await prisma.address.create({
    data: { line1: "789 Pine Rd", city: "Oakland", state: "CA", country: "US", postalCode: "94603" },
  });
  const addr4 = await prisma.address.create({
    data: { line1: "321 Elm St", city: "Oakland", state: "CA", country: "US", postalCode: "94604" },
  });
  const addr5 = await prisma.address.create({
    data: { line1: "654 Maple Dr", city: "Oakland", state: "CA", country: "US", postalCode: "94605" },
  });
  const addr6 = await prisma.address.create({
    data: { line1: "987 Cedar Ln", city: "Oakland", state: "CA", country: "US", postalCode: "94606" },
  });
  const addr7 = await prisma.address.create({
    data: { line1: "111 Birch Blvd", city: "Alameda", state: "CA", country: "US", postalCode: "94501" },
  });
  const addr8 = await prisma.address.create({
    data: { line1: "222 Walnut Ave", city: "Alameda", state: "CA", country: "US", postalCode: "94502" },
  });
  const addr9 = await prisma.address.create({
    data: { line1: "333 Spruce St", city: "Berkeley", state: "CA", country: "US", postalCode: "94701" },
  });
  const addr10 = await prisma.address.create({
    data: { line1: "444 Ash Way", city: "Berkeley", state: "CA", country: "US", postalCode: "94702" },
  });
  const addr11 = await prisma.address.create({
    data: { line1: "555 Poplar Ct", city: "Emeryville", state: "CA", country: "US", postalCode: "94608" },
  });
  const addr12 = await prisma.address.create({
    data: { line1: "666 Willow Rd", city: "Emeryville", state: "CA", country: "US", postalCode: "94609" },
  });
  const addr13 = await prisma.address.create({
    data: { line1: "777 Sycamore Ave", city: "San Leandro", state: "CA", country: "US", postalCode: "94577" },
  });

  void addr12;
  void addr13;

  // ── Restaurant ────────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.create({
    data: {
      phoneNumber: "555-123-4567",
      name: "Claude's Kitchen",
      addressId: restaurantAddress.addressId,
    },
  });

  // ── Product types (10 total) ───────────────────────────────────────────────
  const typeBurger    = await prisma.productType.create({ data: { name: "Burger",     description: "Burgers and smash patties" } });
  const typeSandwich  = await prisma.productType.create({ data: { name: "Sandwich",   description: "Cold and hot sandwiches" } });
  const typeSalad     = await prisma.productType.create({ data: { name: "Salad",      description: "Fresh salads and bowls" } });
  const typeSide      = await prisma.productType.create({ data: { name: "Side",       description: "Fries, rings, and sides" } });
  const typeBeverage  = await prisma.productType.create({ data: { name: "Beverage",   description: "Drinks and shakes" } });
  const typeDessert   = await prisma.productType.create({ data: { name: "Dessert",    description: "Sweets and desserts" } });
  const typeBreakfast = await prisma.productType.create({ data: { name: "Breakfast",  description: "Morning items, served until 11am" } });
  const typeKids      = await prisma.productType.create({ data: { name: "Kids",       description: "Smaller portions for kids" } });
  const typeAlcohol   = await prisma.productType.create({ data: { name: "Alcohol",    description: "Beer, wine, and cocktails" } });
  const typeSpecial   = await prisma.productType.create({ data: { name: "Special",    description: "Daily chef specials" } });

  // ── Products (22 total) ───────────────────────────────────────────────────
  // Burgers (4)
  const pClassicBurger = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Classic Burger",      basePrice: 8.99,  typeId: typeBurger.typeId } } },
    include: { product: true },
  });
  const pCheeseBurger = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Cheeseburger",        basePrice: 9.99,  typeId: typeBurger.typeId } } },
    include: { product: true },
  });
  const pBaconBurger = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Bacon Burger",        basePrice: 11.49, typeId: typeBurger.typeId } } },
    include: { product: true },
  });
  const pMushroomBurger = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Mushroom Swiss Burger", basePrice: 12.99, typeId: typeBurger.typeId } } },
    include: { product: true },
  });

  // Sandwiches (3)
  const pBLT = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "BLT Sandwich",        basePrice: 8.49,  typeId: typeSandwich.typeId } } },
    include: { product: true },
  });
  const pClub = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Club Sandwich",       basePrice: 10.49, typeId: typeSandwich.typeId } } },
    include: { product: true },
  });
  const pGrilledCheese = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Grilled Cheese",      basePrice: 6.99,  typeId: typeSandwich.typeId } } },
    include: { product: true },
  });

  // Salads (2)
  const pCaesar = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Caesar Salad",        basePrice: 9.99,  typeId: typeSalad.typeId } } },
    include: { product: true },
  });
  const pGarden = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Garden Salad",        basePrice: 7.99,  typeId: typeSalad.typeId } } },
    include: { product: true },
  });

  // Sides (3)
  const pFries = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "French Fries",        basePrice: 3.99,  typeId: typeSide.typeId } } },
    include: { product: true },
  });
  const pOnionRings = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Onion Rings",         basePrice: 4.49,  typeId: typeSide.typeId } } },
    include: { product: true },
  });
  const pColeslaw = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Coleslaw",            basePrice: 2.99,  typeId: typeSide.typeId } } },
    include: { product: true },
  });

  // Beverages (3)
  const pSoda = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Fountain Soda",       basePrice: 1.99,  typeId: typeBeverage.typeId } } },
    include: { product: true },
  });
  const pMilkshake = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Milkshake",           basePrice: 4.99,  typeId: typeBeverage.typeId } } },
    include: { product: true },
  });
  const pLemonade = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Fresh Lemonade",      basePrice: 2.99,  typeId: typeBeverage.typeId } } },
    include: { product: true },
  });

  // Desserts (2)
  const pBrownie = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Chocolate Brownie",   basePrice: 3.99,  typeId: typeDessert.typeId } } },
    include: { product: true },
  });
  const pApplePie = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Apple Pie Slice",     basePrice: 4.49,  typeId: typeDessert.typeId } } },
    include: { product: true },
  });

  // Breakfast (1)
  const pBreakfastBurrito = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Breakfast Burrito",   basePrice: 8.99,  typeId: typeBreakfast.typeId } } },
    include: { product: true },
  });

  // Kids (1)
  const pKidsBurger = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Kids Burger",         basePrice: 5.99,  typeId: typeKids.typeId } } },
    include: { product: true },
  });

  // Alcohol (1)
  const pDraftBeer = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Draft Beer (16oz)",   basePrice: 6.99,  typeId: typeAlcohol.typeId } } },
    include: { product: true },
  });

  // Special (2)
  const pDailySpecial = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Chef's Daily Special", basePrice: 14.99, typeId: typeSpecial.typeId } } },
    include: { product: true },
  });
  const pSeasonalSalad = await prisma.orderableItem.create({
    data: { itemType: "product", product: { create: { name: "Seasonal Salad",      basePrice: 11.99, typeId: typeSpecial.typeId } } },
    include: { product: true },
  });

  // Helper to get the typed product record
  const prod = (item: typeof pFries) => item.product!;

  // ── Packages (5) ─────────────────────────────────────────────────────────
  await prisma.orderableItem.create({
    data: {
      itemType: "package",
      package: {
        create: {
          name: "Classic Combo",
          bundlePrice: 12.99,
          packageProducts: {
            create: [
              { productId: prod(pClassicBurger).productId },
              { productId: prod(pFries).productId },
              { productId: prod(pSoda).productId },
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
          name: "Cheese Combo",
          bundlePrice: 13.99,
          packageProducts: {
            create: [
              { productId: prod(pCheeseBurger).productId },
              { productId: prod(pFries).productId },
              { productId: prod(pSoda).productId },
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
              { productId: prod(pOnionRings).productId },
              { productId: prod(pMilkshake).productId },
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
          name: "Kids Meal",
          bundlePrice: 7.99,
          packageProducts: {
            create: [
              { productId: prod(pKidsBurger).productId },
              { productId: prod(pFries).productId },
              { productId: prod(pSoda).productId },
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
          name: "Bacon Deluxe Combo",
          bundlePrice: 15.99,
          packageProducts: {
            create: [
              { productId: prod(pBaconBurger).productId },
              { productId: prod(pOnionRings).productId },
              { productId: prod(pMilkshake).productId },
            ],
          },
        },
      },
    },
  });

  // ── Inventory (initial stock for all products) ─────────────────────────────
  const stockLevels: [number, number][] = [
    [prod(pClassicBurger).productId,    40],
    [prod(pCheeseBurger).productId,     40],
    [prod(pBaconBurger).productId,      30],
    [prod(pMushroomBurger).productId,   25],
    [prod(pBLT).productId,              35],
    [prod(pClub).productId,             30],
    [prod(pGrilledCheese).productId,    40],
    [prod(pCaesar).productId,           25],
    [prod(pGarden).productId,           25],
    [prod(pFries).productId,           100],
    [prod(pOnionRings).productId,       60],
    [prod(pColeslaw).productId,         50],
    [prod(pSoda).productId,            120],
    [prod(pMilkshake).productId,        40],
    [prod(pLemonade).productId,         50],
    [prod(pBrownie).productId,          30],
    [prod(pApplePie).productId,         20],
    [prod(pBreakfastBurrito).productId, 20],
    [prod(pKidsBurger).productId,       30],
    [prod(pDraftBeer).productId,        80],
    [prod(pDailySpecial).productId,     15],
    [prod(pSeasonalSalad).productId,    15],
  ];

  for (const [productId, qty] of stockLevels) {
    await prisma.inventoryTransaction.create({
      data: { productId, quantityChange: qty, reason: "initial_stock" },
    });
  }

  // ── Roles (10) ────────────────────────────────────────────────────────────
  const roleManager    = await prisma.role.create({ data: { name: "manager",    description: "Oversees daily operations and staff" } });
  const roleGM         = await prisma.role.create({ data: { name: "gm",         description: "General manager — full authority" } });
  const roleServer     = await prisma.role.create({ data: { name: "server",     description: "Takes orders and serves customers" } });
  const roleCashier    = await prisma.role.create({ data: { name: "cashier",    description: "Handles customer orders and payments" } });
  const roleCook       = await prisma.role.create({ data: { name: "cook",       description: "Prepares hot food items" } });
  const rolePrep       = await prisma.role.create({ data: { name: "prep",       description: "Handles food prep before service" } });
  const roleExpo       = await prisma.role.create({ data: { name: "expo",       description: "Expedites food from kitchen to floor" } });
  const roleHost       = await prisma.role.create({ data: { name: "host",       description: "Greets and seats customers" } });
  const roleDishwasher = await prisma.role.create({ data: { name: "dishwasher", description: "Cleans dishes and kitchen equipment" } });
  const roleRunner     = await prisma.role.create({ data: { name: "runner",     description: "Delivers food from kitchen to tables" } });

  // ── Employees (10) ────────────────────────────────────────────────────────
  const alice = await prisma.employee.create({
    data: {
      firstName: "Alice", lastName: "Johnson",
      dateOfBirth: new Date("1985-03-15"),
      storeNumber: restaurant.storeNumber,
      salary: 72000, hireDate: new Date("2020-01-10"),
      addressId: addr2.addressId,
      employeeRoles: { create: [{ roleId: roleGM.roleId }] },
    },
  });

  const bob = await prisma.employee.create({
    data: {
      firstName: "Bob", lastName: "Martinez",
      dateOfBirth: new Date("1990-07-22"),
      storeNumber: restaurant.storeNumber,
      salary: 58000, hireDate: new Date("2021-03-05"),
      addressId: addr3.addressId,
      employeeRoles: { create: [{ roleId: roleManager.roleId }] },
    },
  });

  const carol = await prisma.employee.create({
    data: {
      firstName: "Carol", lastName: "Lee",
      dateOfBirth: new Date("1995-11-30"),
      storeNumber: restaurant.storeNumber,
      salary: 42000, hireDate: new Date("2022-06-20"),
      addressId: addr4.addressId,
      employeeRoles: { create: [{ roleId: roleServer.roleId }, { roleId: roleCashier.roleId }] },
    },
  });

  const david = await prisma.employee.create({
    data: {
      firstName: "David", lastName: "Kim",
      dateOfBirth: new Date("1992-04-08"),
      storeNumber: restaurant.storeNumber,
      salary: 40000, hireDate: new Date("2022-09-15"),
      addressId: addr5.addressId,
      employeeRoles: { create: [{ roleId: roleServer.roleId }] },
    },
  });

  const emma = await prisma.employee.create({
    data: {
      firstName: "Emma", lastName: "Patel",
      dateOfBirth: new Date("1998-02-14"),
      storeNumber: restaurant.storeNumber,
      salary: 38000, hireDate: new Date("2023-01-03"),
      addressId: addr6.addressId,
      employeeRoles: { create: [{ roleId: roleCashier.roleId }] },
    },
  });

  const frank = await prisma.employee.create({
    data: {
      firstName: "Frank", lastName: "Torres",
      dateOfBirth: new Date("1988-09-19"),
      storeNumber: restaurant.storeNumber,
      salary: 44000, hireDate: new Date("2021-11-01"),
      addressId: addr7.addressId,
      employeeRoles: { create: [{ roleId: roleCook.roleId }] },
    },
  });

  const grace = await prisma.employee.create({
    data: {
      firstName: "Grace", lastName: "Nguyen",
      dateOfBirth: new Date("1996-06-25"),
      storeNumber: restaurant.storeNumber,
      salary: 40000, hireDate: new Date("2022-04-18"),
      addressId: addr8.addressId,
      employeeRoles: { create: [{ roleId: roleCook.roleId }, { roleId: rolePrep.roleId }] },
    },
  });

  const henry = await prisma.employee.create({
    data: {
      firstName: "Henry", lastName: "Davis",
      dateOfBirth: new Date("2000-12-01"),
      storeNumber: restaurant.storeNumber,
      salary: 36000, hireDate: new Date("2023-05-22"),
      addressId: addr9.addressId,
      employeeRoles: { create: [{ roleId: roleExpo.roleId }] },
    },
  });

  const isabel = await prisma.employee.create({
    data: {
      firstName: "Isabel", lastName: "Ramirez",
      dateOfBirth: new Date("1997-08-10"),
      storeNumber: restaurant.storeNumber,
      salary: 36000, hireDate: new Date("2023-07-10"),
      addressId: addr10.addressId,
      employeeRoles: { create: [{ roleId: roleHost.roleId }] },
    },
  });

  const james = await prisma.employee.create({
    data: {
      firstName: "James", lastName: "Wilson",
      dateOfBirth: new Date("2001-03-28"),
      storeNumber: restaurant.storeNumber,
      salary: 34000, hireDate: new Date("2024-02-05"),
      addressId: addr11.addressId,
      employeeRoles: { create: [{ roleId: roleRunner.roleId }, { roleId: roleDishwasher.roleId }] },
    },
  });

  void alice; void bob; void frank; void grace; void henry; void isabel; void james;

  // ── Shifts ────────────────────────────────────────────────────────────────
  const today = new Date("2026-04-27");
  const mkDate = (h: number, m = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
  const yesterday = new Date("2026-04-26");
  const mkYest = (h: number, m = 0) => new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), h, m);

  await prisma.shift.create({
    data: {
      employeeId: alice.employeeId, roleId: roleGM.roleId,
      startTimestamp: mkYest(8), endTimestamp: mkYest(16),
      clockInTimestamp: mkYest(7, 58), clockOutTimestamp: mkYest(16, 5),
    },
  });
  await prisma.shift.create({
    data: {
      employeeId: bob.employeeId, roleId: roleManager.roleId,
      startTimestamp: mkDate(8), endTimestamp: mkDate(16),
      clockInTimestamp: mkDate(8, 2),
    },
  });
  await prisma.shift.create({
    data: {
      employeeId: carol.employeeId, roleId: roleServer.roleId,
      startTimestamp: mkDate(10), endTimestamp: mkDate(18),
      clockInTimestamp: mkDate(10, 0),
    },
  });
  await prisma.shift.create({
    data: {
      employeeId: david.employeeId, roleId: roleServer.roleId,
      startTimestamp: mkDate(11), endTimestamp: mkDate(19),
    },
  });
  await prisma.shift.create({
    data: {
      employeeId: frank.employeeId, roleId: roleCook.roleId,
      startTimestamp: mkDate(9), endTimestamp: mkDate(17),
      clockInTimestamp: mkDate(9, 1),
    },
  });
  await prisma.shift.create({
    data: {
      employeeId: grace.employeeId, roleId: roleCook.roleId,
      startTimestamp: mkDate(9), endTimestamp: mkDate(17),
      clockInTimestamp: mkDate(8, 58),
    },
  });
  await prisma.shift.create({
    data: {
      employeeId: henry.employeeId, roleId: roleExpo.roleId,
      startTimestamp: mkDate(10), endTimestamp: mkDate(18),
      clockInTimestamp: mkDate(10, 3),
    },
  });

  // ── Discounts (10) ────────────────────────────────────────────────────────
  void await prisma.discount.create({ data: { name: "Employee Discount",  value: 30,  type: "percent" } });
  const discHappyHour   = await prisma.discount.create({ data: { name: "Happy Hour",         value: 15,  type: "percent" } });
  const discSenior      = await prisma.discount.create({ data: { name: "Senior Discount",    value: 10,  type: "percent" } });
  const discStudent     = await prisma.discount.create({ data: { name: "Student Discount",   value: 10,  type: "percent" } });
  const discMilitary    = await prisma.discount.create({ data: { name: "Military Discount",  value: 15,  type: "percent" } });
  void await prisma.discount.create({ data: { name: "Manager Comp",       value: 100, type: "percent" } });
  const disc5Off        = await prisma.discount.create({ data: { name: "$5 Off",             value: 5,   type: "fixed" } });
  const disc10Off       = await prisma.discount.create({ data: { name: "$10 Off",            value: 10,  type: "fixed" } });
  const discBirthday    = await prisma.discount.create({ data: { name: "Birthday Special",   value: 20,  type: "percent" } });
  const discLoyalty     = await prisma.discount.create({ data: { name: "Loyalty Reward",     value: 5,   type: "fixed" } });

  // ── PRNG (xorshift32, seed=42, deterministic) ─────────────────────────────
  let prngState = 42;
  function prng(): number {
    prngState ^= prngState << 13;
    prngState ^= prngState >> 17;
    prngState ^= prngState << 5;
    prngState = prngState >>> 0;
    return prngState / 0x100000000;
  }
  function rndInt(lo: number, hi: number) { return Math.floor(prng() * (hi - lo + 1)) + lo; }
  function rndPick<T>(arr: readonly T[]): T { return arr[Math.floor(prng() * arr.length)]!; }
  function rndWeighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = prng() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]!;
      if (r <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }
  function r2(n: number) { return Math.round(n * 100) / 100; }

  // ── Analytics menu pool (itemId, price, weight) ──────────────────────────
  const menuPool = [
    { itemId: pClassicBurger.itemId,    price: 8.99,  weight: 12 },
    { itemId: pCheeseBurger.itemId,     price: 9.99,  weight: 10 },
    { itemId: pBaconBurger.itemId,      price: 11.49, weight: 6  },
    { itemId: pMushroomBurger.itemId,   price: 12.99, weight: 4  },
    { itemId: pBLT.itemId,              price: 8.49,  weight: 3  },
    { itemId: pClub.itemId,             price: 10.49, weight: 3  },
    { itemId: pGrilledCheese.itemId,    price: 6.99,  weight: 3  },
    { itemId: pCaesar.itemId,           price: 9.99,  weight: 4  },
    { itemId: pGarden.itemId,           price: 7.99,  weight: 3  },
    { itemId: pFries.itemId,            price: 3.99,  weight: 15 },
    { itemId: pOnionRings.itemId,       price: 4.49,  weight: 5  },
    { itemId: pColeslaw.itemId,         price: 2.99,  weight: 2  },
    { itemId: pSoda.itemId,             price: 1.99,  weight: 16 },
    { itemId: pMilkshake.itemId,        price: 4.99,  weight: 5  },
    { itemId: pLemonade.itemId,         price: 2.99,  weight: 4  },
    { itemId: pBrownie.itemId,          price: 3.99,  weight: 3  },
    { itemId: pApplePie.itemId,         price: 4.49,  weight: 2  },
    { itemId: pBreakfastBurrito.itemId, price: 8.99,  weight: 1  },
    { itemId: pKidsBurger.itemId,       price: 5.99,  weight: 3  },
    { itemId: pDraftBeer.itemId,        price: 6.99,  weight: 4  },
    { itemId: pDailySpecial.itemId,     price: 14.99, weight: 2  },
    { itemId: pSeasonalSalad.itemId,    price: 11.99, weight: 2  },
  ] as const;

  // Server employees for generated orders
  const serverEmps = [carol, david, emma] as const;
  const serverWeights = [50, 35, 15] as const;

  // Discount pool (not Employee/Manager Comp)
  const discountPool = [
    { disc: discHappyHour, weight: 20 },
    { disc: discSenior,    weight: 15 },
    { disc: discStudent,   weight: 15 },
    { disc: discMilitary,  weight: 12 },
    { disc: discBirthday,  weight: 8  },
    { disc: disc5Off,      weight: 15 },
    { disc: disc10Off,     weight: 10 },
    { disc: discLoyalty,   weight: 15 },
  ] as const;

  // Tip rates (fraction of taxable subtotal)
  const tipRates   = [0, 0.10, 0.15, 0.18, 0.20, 0.22, 0.25] as const;
  const tipWeights = [8,   10,   20,   20,   25,   10,    7  ] as const;

  // Hour distribution weighted toward lunch (11-14) and dinner (17-21)
  const hourWeights = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,   // 0-9
    1, 6, 12, 10, 5, 2, 3,           // 10-16
    8, 12, 10, 7, 5, 2, 1,           // 17-23
  ] as const;
  const hours = Array.from({ length: 24 }, (_, i) => i) as number[];

  // Card brands
  const cardBrands   = ["Visa", "Mastercard", "Amex", "Discover"] as const;
  const cardWeights2 = [45, 30, 15, 10] as const;

  const customerNames = [
    "Alex Chen", "Jordan Smith", "Taylor Brown", "Morgan Davis", "Casey Wilson",
    "Riley Johnson", "Avery Martinez", "Quinn Thompson", "Blake Anderson", "Drew Williams",
    "Sam Garcia", "Jamie Miller", "Chris Rodriguez", "Pat Lee", "Skyler Turner",
    "Dana White", "Jesse Harris", "Logan Clark", "Reese Lewis", "Cameron Walker",
  ] as const;

  const cardholderNames = [
    "Alex Chen", "Jordan Smith", "Taylor Brown", "Morgan Davis", "Casey Wilson",
    "Riley Johnson", "Avery Martinez", "Quinn Thompson", "Blake Anderson", "Drew Williams",
    "Sam Garcia", "Jamie Miller", "Chris Rodriguez", "Pat Lee", "Skyler Turner",
  ] as const;

  // ── 120 completed orders: Apr 1–30, 2026 (4 per day) ─────────────────────
  let completedCount = 0;
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const day = dayOffset + 1; // Apr 1–30

    for (let i = 0; i < 4; i++) {
      const hour   = rndWeighted(hours, hourWeights);
      const minute = rndInt(0, 59);
      const orderTime = new Date(2026, 3, day, hour, minute, 0); // month 3 = April

      const employee = rndWeighted(serverEmps, serverWeights);

      // Pick 1–4 distinct items with weighted selection
      const itemCount = rndWeighted([1, 2, 3, 4] as const, [15, 40, 30, 15] as const);
      const usedItemIds = new Set<number>();
      const chosenItems: Array<{ itemId: number; price: number; qty: number }> = [];

      for (let j = 0; j < itemCount; j++) {
        const available = menuPool.filter(m => !usedItemIds.has(m.itemId));
        if (available.length === 0) break;
        const chosen = rndWeighted(available, available.map(a => a.weight));
        usedItemIds.add(chosen.itemId);
        const qty = rndWeighted([1, 2] as const, [80, 20] as const);
        chosenItems.push({ itemId: chosen.itemId, price: chosen.price, qty });
      }

      const subtotal = r2(chosenItems.reduce((s, c) => s + c.price * c.qty, 0));

      // Optional discount (~20% of orders)
      let discountAmount = 0;
      let appliedDiscount: (typeof discountPool)[number]["disc"] | null = null;
      if (prng() < 0.20) {
        appliedDiscount = rndWeighted(
          discountPool.map(d => d.disc),
          discountPool.map(d => d.weight),
        );
        const dv = appliedDiscount.value.toNumber();
        discountAmount = appliedDiscount.type === "percent"
          ? r2(subtotal * dv / 100)
          : Math.min(subtotal, dv);
      }

      const taxable = r2(Math.max(0, subtotal - discountAmount));
      const tax     = r2(taxable * 0.0875);
      const tipRate = rndWeighted(tipRates, tipWeights);
      const tip     = r2(taxable * tipRate);
      const total   = r2(taxable + tax + tip);

      const fireTime = new Date(orderTime.getTime() + rndInt(8, 20) * 60_000);

      const order = await prisma.order.create({
        data: {
          customerName:      prng() < 0.60 ? rndPick(customerNames) : null,
          storeNumber:       restaurant.storeNumber,
          taxPercent:        8.75,
          tip:               tip > 0 ? tip : null,
          subtotal,
          total,
          preparationStatus: "completed",
          paymentStatus:     "paid",
          employeeId:        employee.employeeId,
          timestamp:         orderTime,
          orderItems: {
            create: chosenItems.map(c => ({
              itemId:          c.itemId,
              quantity:        c.qty,
              priceAtPurchase: c.price,
              kitchenStatus:   "delivered",
              firedAt:         fireTime,
            })),
          },
        },
      });

      if (appliedDiscount !== null) {
        await prisma.orderDiscount.create({
          data: { orderId: order.orderId, discountId: appliedDiscount.discountId },
        });
      }

      // Payment (70% card / 30% cash)
      const isCard  = prng() < 0.70;
      const payment = await prisma.payment.create({
        data: { orderId: order.orderId, type: isCard ? "electronic" : "cash", amount: total },
      });

      if (isCard) {
        const brand    = rndWeighted(cardBrands, cardWeights2);
        const lastFour = String(rndInt(1000, 9999));
        const card     = await prisma.card.create({
          data: {
            cardholderName:  rndPick(cardholderNames),
            token:           `tok_seed_${lastFour}_${order.orderId}`,
            lastFour,
            brand,
            expirationMonth: rndInt(1, 12),
            expirationYear:  rndInt(2026, 2030),
          },
        });
        await prisma.electronicPayment.create({
          data: { cardId: card.cardId, paymentId: payment.paymentId },
        });
      }

      completedCount++;
    }
  }

  // ── 6 cancelled orders (unpaid, no items) ────────────────────────────────
  for (let k = 0; k < 6; k++) {
    const day        = rndInt(1, 29);
    const hour       = rndWeighted(hours, hourWeights);
    const orderTime  = new Date(2026, 3, day, hour, rndInt(0, 59), 0);
    const employee   = rndWeighted(serverEmps, serverWeights);
    await prisma.order.create({
      data: {
        customerName:      prng() < 0.50 ? rndPick(customerNames) : null,
        storeNumber:       restaurant.storeNumber,
        taxPercent:        8.75,
        subtotal:          0,
        total:             0,
        preparationStatus: "cancelled",
        paymentStatus:     "unpaid",
        employeeId:        employee.employeeId,
        timestamp:         orderTime,
      },
    });
  }

  // ── Demo order (one completed tab to show history) ────────────────────────
  const fireTime = new Date("2026-04-26T12:30:00");
  const subtotal = Number(prod(pCheeseBurger).basePrice) + Number(prod(pFries).basePrice) + Number(prod(pSoda).basePrice);
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  await prisma.order.create({
    data: {
      customerName: "Jane Smith",
      storeNumber: restaurant.storeNumber,
      taxPercent: 8.75,
      tip: 3.00,
      subtotal,
      total: total + 3.00,
      preparationStatus: "completed",
      paymentStatus: "paid",
      employeeId: carol.employeeId,
      orderItems: {
        create: [
          { itemId: pCheeseBurger.itemId, quantity: 1, priceAtPurchase: prod(pCheeseBurger).basePrice, kitchenStatus: "delivered", firedAt: fireTime },
          { itemId: pFries.itemId,        quantity: 1, priceAtPurchase: prod(pFries).basePrice,        kitchenStatus: "delivered", firedAt: fireTime },
          { itemId: pSoda.itemId,         quantity: 1, priceAtPurchase: prod(pSoda).basePrice,         kitchenStatus: "delivered", firedAt: fireTime },
        ],
      },
    },
  });

  console.log("✓ Seeding complete");
  console.log(`  Addresses: 13 | Product types: 10 | Products: 22 | Packages: 5`);
  console.log(`  Roles: 10 | Employees: 10 | Discounts: 10 | Shifts: 7`);
  console.log(`  Inventory transactions: ${stockLevels.length} (initial stock)`);
  console.log(`  Analytics orders: ${completedCount} completed + 6 cancelled + 1 demo`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
