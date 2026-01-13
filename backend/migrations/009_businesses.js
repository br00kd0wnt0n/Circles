/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('businesses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.string('logo_url', 500);
    table.string('address', 300);
    table.decimal('lat', 10, 7);
    table.decimal('lng', 10, 7);
    table.string('phone', 20);
    table.string('website', 300);
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Index for active businesses
  await knex.schema.raw('CREATE INDEX idx_businesses_active ON businesses(is_active)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('businesses');
}
