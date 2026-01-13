/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('business_id').references('id').inTable('businesses').onDelete('SET NULL');
    table.string('title', 200).notNullable();
    table.text('description');
    table.string('color', 7).defaultTo('#9CAF88');
    table.string('image_url', 500);
    table.date('event_date').notNullable();
    table.string('event_time', 50);
    table.string('end_time', 50);
    table.string('location', 300);
    table.decimal('lat', 10, 7);
    table.decimal('lng', 10, 7);
    table.string('event_url', 500);
    table.boolean('is_active').defaultTo(true);
    table.integer('priority').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_events_business ON events(business_id)');
  await knex.schema.raw('CREATE INDEX idx_events_active ON events(is_active)');
  await knex.schema.raw('CREATE INDEX idx_events_date ON events(event_date)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('events');
}
