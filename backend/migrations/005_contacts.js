/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('contacts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('owner_household_id').notNullable().references('id').inTable('households').onDelete('CASCADE');
    table.uuid('linked_household_id').references('id').inTable('households').onDelete('SET NULL');
    table.string('phone', 20);
    table.string('display_name', 100).notNullable();
    table.string('avatar', 10); // Emoji avatar
    table.boolean('is_app_user').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_contacts_owner ON contacts(owner_household_id)');
  await knex.schema.raw('CREATE INDEX idx_contacts_linked ON contacts(linked_household_id)');
  await knex.schema.raw('CREATE INDEX idx_contacts_phone ON contacts(phone)');

  // Unique constraint: one contact per phone per owner
  await knex.schema.raw('CREATE UNIQUE INDEX idx_contacts_owner_phone ON contacts(owner_household_id, phone) WHERE phone IS NOT NULL');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('contacts');
}
