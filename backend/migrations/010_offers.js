/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('offers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.text('description');
    table.string('color', 7).defaultTo('#9CAF88'); // Card background color
    table.string('image_url', 500);
    table.string('promo_code', 50);
    table.date('valid_from');
    table.date('valid_until');
    table.boolean('is_active').defaultTo(true);
    table.integer('priority').defaultTo(0); // For sorting
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_offers_business ON offers(business_id)');
  await knex.schema.raw('CREATE INDEX idx_offers_active ON offers(is_active)');
  await knex.schema.raw('CREATE INDEX idx_offers_valid ON offers(valid_from, valid_until)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('offers');
}
