const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const email = process.env.FACTORY_MANAGER_EMAIL || 'factory@reproutes.com';
const password = process.env.FACTORY_MANAGER_PASSWORD || 'RpFactory@2026#19';

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [tenants] = await conn.execute(
      'SELECT id FROM Tenant WHERE slug = ? LIMIT 1',
      ['reproutes'],
    );
    if (tenants.length === 0) {
      throw new Error('Tenant "reproutes" was not found');
    }

    const tenantId = tenants[0].id;
    const passwordHash = await bcrypt.hash(password, 12);
    const [users] = await conn.execute(
      'SELECT id FROM User WHERE email = ? LIMIT 1',
      [email],
    );

    if (users.length > 0) {
      await conn.execute(
        'UPDATE User SET passwordHash = ?, name = ?, role = ?, tenantId = ?, status = ?, updatedAt = NOW() WHERE id = ?',
        [passwordHash, 'Reproutes Factory Manager', 'FACTORY_MANAGER', tenantId, 'ACTIVE', users[0].id],
      );
      console.log(`Updated ${email} as an active FACTORY_MANAGER.`);
    } else {
      await conn.execute(
        'INSERT INTO User (id, email, passwordHash, name, role, tenantId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [`u_factory_${Date.now()}`, email, passwordHash, 'Reproutes Factory Manager', 'FACTORY_MANAGER', tenantId, 'ACTIVE'],
      );
      console.log(`Created ${email} as an active FACTORY_MANAGER.`);
    }

    console.log(`Factory login email: ${email}`);
    console.log(`Factory login password: ${password}`);
  } finally {
    await conn.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
