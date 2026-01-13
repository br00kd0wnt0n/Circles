/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('circles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('owner_household_id').notNullable().references('id').inTable('households').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('color', 7).defaultTo('#9CAF88'); // Hex color
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Index for household lookups
  await knex.schema.raw('CREATE INDEX idx_circles_household ON circles(owner_household_id)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('circles');
}
