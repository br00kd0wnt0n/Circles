import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing admin users
  await knex('admin_users').del();

  // Use environment variable or generate a secure random password
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(16).toString('hex');
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@circles.app';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await knex('admin_users').insert([
    {
      email: adminEmail,
      password_hash: hashedPassword,
      name: 'Admin',
      role: 'super_admin',
      is_active: true
    }
  ]);

  console.log('Admin user seeded');
  console.log(`Email: ${adminEmail}`);

  // Only show password if it was auto-generated (not from env var)
  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.log(`Generated Password: ${adminPassword}`);
    console.log('SAVE THIS PASSWORD - it will not be shown again!');
  } else {
    console.log('Password: [set from ADMIN_SEED_PASSWORD env var]');
  }
}
