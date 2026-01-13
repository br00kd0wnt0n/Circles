/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('circle_members', (table) => {
    table.uuid('circle_id').notNullable().references('id').inTable('circles').onDelete('CASCADE');
    table.uuid('contact_id').notNullable().references('id').inTable('contacts').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Composite primary key
    table.primary(['circle_id', 'contact_id']);
  });

  // Indexes for lookups
  await knex.schema.raw('CREATE INDEX idx_circle_members_circle ON circle_members(circle_id)');
  await knex.schema.raw('CREATE INDEX idx_circle_members_contact ON circle_members(contact_id)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('circle_members');
}
