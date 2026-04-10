import mysql from './node_modules/.pnpm/mysql2@3.15.1/node_modules/mysql2/promise.js';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);

const stmts = [
  [`categories`, `CREATE TABLE IF NOT EXISTS \`categories\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`slug\` varchar(128) NOT NULL,
    \`description\` text,
    \`imageUrl\` text,
    \`active\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`categories_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`categories_slug_unique\` UNIQUE(\`slug\`)
  )`],
  [`products`, `CREATE TABLE IF NOT EXISTS \`products\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`categoryId\` int NOT NULL,
    \`name\` varchar(256) NOT NULL,
    \`slug\` varchar(256) NOT NULL,
    \`description\` text,
    \`price\` decimal(10,2) NOT NULL,
    \`comparePrice\` decimal(10,2),
    \`imageUrl\` text,
    \`images\` json,
    \`sku\` varchar(64),
    \`stock\` int NOT NULL DEFAULT 0,
    \`active\` boolean NOT NULL DEFAULT true,
    \`featured\` boolean NOT NULL DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`products_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`products_slug_unique\` UNIQUE(\`slug\`)
  )`],
  [`addresses`, `CREATE TABLE IF NOT EXISTS \`addresses\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`label\` varchar(64) DEFAULT 'Casa',
    \`recipientName\` varchar(128) NOT NULL,
    \`phone\` varchar(20),
    \`zipCode\` varchar(10) NOT NULL,
    \`street\` varchar(256) NOT NULL,
    \`number\` varchar(16) NOT NULL,
    \`complement\` varchar(128),
    \`neighborhood\` varchar(128) NOT NULL,
    \`city\` varchar(128) NOT NULL,
    \`state\` varchar(2) NOT NULL,
    \`isDefault\` boolean NOT NULL DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`addresses_id\` PRIMARY KEY(\`id\`)
  )`],
  [`orders`, `CREATE TABLE IF NOT EXISTS \`orders\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`status\` enum('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
    \`total\` decimal(10,2) NOT NULL,
    \`subtotal\` decimal(10,2) NOT NULL,
    \`shippingCost\` decimal(10,2) NOT NULL DEFAULT '0.00',
    \`shippingAddress\` json,
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`orders_id\` PRIMARY KEY(\`id\`)
  )`],
  [`order_items`, `CREATE TABLE IF NOT EXISTS \`order_items\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`orderId\` int NOT NULL,
    \`productId\` int NOT NULL,
    \`productName\` varchar(256) NOT NULL,
    \`productImageUrl\` text,
    \`quantity\` int NOT NULL,
    \`unitPrice\` decimal(10,2) NOT NULL,
    \`totalPrice\` decimal(10,2) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`order_items_id\` PRIMARY KEY(\`id\`)
  )`],
  [`push_subscriptions`, `CREATE TABLE IF NOT EXISTS \`push_subscriptions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`endpoint\` text NOT NULL,
    \`p256dh\` text NOT NULL,
    \`auth\` text NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`push_subscriptions_id\` PRIMARY KEY(\`id\`)
  )`]
];

for (const [name, stmt] of stmts) {
  try {
    await conn.execute(stmt);
    console.log('OK:', name);
  } catch(e) {
    if (e.sqlMessage?.includes('already exists')) {
      console.log('EXISTS:', name);
    } else {
      console.error('ERR', name, ':', e.sqlMessage?.substring(0, 100));
    }
  }
}
await conn.end();
console.log('Done');
