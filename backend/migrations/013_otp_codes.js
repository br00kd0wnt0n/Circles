/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Table to store OTP codes for phone verification
  await knex.schema.createTable('otp_codes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('phone', 20).notNullable();
    table.string('code', 6).notNullable();
    table.integer('attempts').defaultTo(0);
    table.boolean('verified').defaultTo(false);
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_otp_codes_phone ON otp_codes(phone)');
  await knex.schema.raw('CREATE INDEX idx_otp_codes_expires ON otp_codes(expires_at)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('otp_codes');
}
