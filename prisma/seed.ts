import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DIRECT_URL ||
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const storeSettings = await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Higherskins",
      description: "Refined athletic apparel for men, women and kids. Shipped from the United Kingdom.",
      email: "info@higherskins.com",
      currency: "GBP",
      taxRate: 20,
      freeShippingMin: 100,
    },
  });
  console.log("Store settings:", storeSettings.name);

  // Categories are seeded by `npm run import:woo` from the WooCommerce export —
  // do not create additional placeholder categories here to avoid dead entries.

  // Test users
  // test@gmail.com / test123! — Customer with $10,000 budget
  // admin@gmail.com / admin123! — Admin user
  const testPassword = await bcrypt.hash("test123!", 12);
  const adminPassword = await bcrypt.hash("admin123!", 12);

  const testUser = await prisma.user.upsert({
    where: { email: "test@gmail.com" },
    update: { passwordHash: testPassword, balance: 10000 },
    create: {
      email: "test@gmail.com",
      passwordHash: testPassword,
      name: "Test Customer",
      role: "CUSTOMER",
      balance: 10000,
    },
  });
  console.log(`Created test user: ${testUser.email} (role: ${testUser.role})`);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: { passwordHash: adminPassword },
    create: {
      email: "admin@gmail.com",
      passwordHash: adminPassword,
      name: "Store Admin",
      role: "ADMIN",
    },
  });
  console.log(`Created admin user: ${adminUser.email} (role: ${adminUser.role})`);

  const page = await prisma.page.upsert({
    where: { slug: "about-us" },
    update: {},
    create: {
      title: "About Us",
      slug: "about-us",
      content:
        "<p>Welcome to Higherskins — a curated apparel edit for men, women and kids.</p><p>We design and source athletic and everyday apparel with sustainable materials — organic cottons, recycled polyesters, and honest fits. Shipped from the United Kingdom with free delivery over £100.</p>",
      isActive: true,
    },
  });
  console.log(`Created page: ${page.title}`);
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
