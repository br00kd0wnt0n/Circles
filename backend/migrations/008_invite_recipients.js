/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('invite_recipients', (table) => {
    table.uuid('invite_id').notNullable().references('id').inTable('invites').onDelete('CASCADE');
    table.uuid('household_id').notNullable().references('id').inTable('households').onDelete('CASCADE');
    table.enum('response', ['pending', 'accepted', 'declined']).defaultTo('pending');
    table.timestamp('responded_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Composite primary key
    table.primary(['invite_id', 'household_id']);
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_invite_recipients_invite ON invite_recipients(invite_id)');
  await knex.schema.raw('CREATE INDEX idx_invite_recipients_household ON invite_recipients(household_id)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('invite_recipients');
}
