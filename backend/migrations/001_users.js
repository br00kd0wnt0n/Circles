/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('phone', 20).unique().notNullable();
    table.boolean('phone_verified').defaultTo(false);
    table.string('display_name', 100);
    table.string('avatar_url', 500);
    table.text('push_subscription'); // JSON string
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create index on phone for fast lookups
  await knex.schema.raw('CREATE INDEX idx_users_phone ON users(phone)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
