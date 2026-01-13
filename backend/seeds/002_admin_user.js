import bcrypt from 'bcryptjs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing admin users
  await knex('admin_users').del();

  // Create default admin user
  // IMPORTANT: Change this password after first login!
  const defaultPassword = 'circles-admin-2024';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  await knex('admin_users').insert([
    {
      email: 'admin@circles.app',
      password_hash: hashedPassword,
      name: 'Admin',
      role: 'super_admin',
      is_active: true
    }
  ]);

  console.log('✅ Admin user seeded');
  console.log('📧 Email: admin@circles.app');
  console.log('🔑 Password: circles-admin-2024');
  console.log('⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!');
}
