/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('invites', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('created_by_household_id').notNullable().references('id').inTable('households').onDelete('CASCADE');
    table.string('activity_type', 50);
    table.string('activity_name', 100);
    table.string('location', 200);
    table.date('proposed_date');
    table.string('proposed_time', 50);
    table.text('message');
    table.enum('status', ['pending', 'confirmed', 'cancelled', 'expired']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Index for lookups
  await knex.schema.raw('CREATE INDEX idx_invites_creator ON invites(created_by_household_id)');
  await knex.schema.raw('CREATE INDEX idx_invites_status ON invites(status)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('invites');
}
