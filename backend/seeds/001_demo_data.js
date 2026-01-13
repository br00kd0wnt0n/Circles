/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing data in correct order (respecting foreign keys)
  await knex('circle_members').del();
  await knex('invite_recipients').del();
  await knex('invites').del();
  await knex('contacts').del();
  await knex('circles').del();
  await knex('household_members').del();
  await knex('households').del();
  await knex('users').del();
  await knex('events').del();
  await knex('offers').del();
  await knex('businesses').del();
  await knex('otp_codes').del();

  // Create demo users
  const [demoUser] = await knex('users').insert([
    {
      phone: '+15551234567',
      phone_verified: true,
      display_name: 'Demo User'
    }
  ]).returning('*');

  // Create demo household
  const [demoHousehold] = await knex('households').insert([
    {
      name: 'The Demo Family',
      status_state: 'available',
      status_note: 'Ready to hang!',
      status_time_window: 'This afternoon'
    }
  ]).returning('*');

  // Add demo user to household
  await knex('household_members').insert([
    {
      household_id: demoHousehold.id,
      user_id: demoUser.id,
      name: 'Demo',
      role: 'adult',
      avatar: '👋',
      is_primary: true
    },
    {
      household_id: demoHousehold.id,
      user_id: null,
      name: 'Partner',
      role: 'adult',
      avatar: '🙂'
    }
  ]);

  // Create friend households (not linked to real users)
  const friendHouseholds = await knex('households').insert([
    {
      name: 'The Johnsons',
      status_state: 'available',
      status_note: 'Free this weekend!',
      status_time_window: 'Saturday afternoon'
    },
    {
      name: 'The Smiths',
      status_state: 'open',
      status_note: 'Kids have soccer until 3',
      status_time_window: 'After 3pm'
    },
    {
      name: 'The Garcias',
      status_state: 'busy',
      status_note: 'Family visiting',
      status_time_window: 'Next week maybe'
    },
    {
      name: 'The Wongs',
      status_state: 'available',
      status_note: null,
      status_time_window: null
    },
    {
      name: 'The Patels',
      status_state: 'open',
      status_note: 'Game night tonight?',
      status_time_window: 'Evening'
    }
  ]).returning('*');

  // Create circles for demo household
  const circles = await knex('circles').insert([
    {
      owner_household_id: demoHousehold.id,
      name: 'Close Friends',
      color: '#9CAF88'
    },
    {
      owner_household_id: demoHousehold.id,
      name: 'Neighbors',
      color: '#7BA7BC'
    },
    {
      owner_household_id: demoHousehold.id,
      name: 'School Parents',
      color: '#D4A574'
    }
  ]).returning('*');

  // Create contacts for demo household
  const contacts = await knex('contacts').insert([
    {
      owner_household_id: demoHousehold.id,
      linked_household_id: friendHouseholds[0].id,
      display_name: 'The Johnsons',
      avatar: '🏠',
      is_app_user: true
    },
    {
      owner_household_id: demoHousehold.id,
      linked_household_id: friendHouseholds[1].id,
      display_name: 'The Smiths',
      avatar: '⚽',
      is_app_user: true
    },
    {
      owner_household_id: demoHousehold.id,
      linked_household_id: friendHouseholds[2].id,
      display_name: 'The Garcias',
      avatar: '🌮',
      is_app_user: true
    },
    {
      owner_household_id: demoHousehold.id,
      linked_household_id: friendHouseholds[3].id,
      display_name: 'The Wongs',
      avatar: '🎮',
      is_app_user: true
    },
    {
      owner_household_id: demoHousehold.id,
      linked_household_id: friendHouseholds[4].id,
      display_name: 'The Patels',
      avatar: '🎲',
      is_app_user: true
    },
    {
      owner_household_id: demoHousehold.id,
      linked_household_id: null,
      display_name: 'Mike (not on app)',
      phone: '+15559876543',
      avatar: '📱',
      is_app_user: false
    }
  ]).returning('*');

  // Add contacts to circles
  await knex('circle_members').insert([
    // Close Friends: Johnsons, Garcias
    { circle_id: circles[0].id, contact_id: contacts[0].id },
    { circle_id: circles[0].id, contact_id: contacts[2].id },
    // Neighbors: Johnsons, Smiths, Wongs
    { circle_id: circles[1].id, contact_id: contacts[0].id },
    { circle_id: circles[1].id, contact_id: contacts[1].id },
    { circle_id: circles[1].id, contact_id: contacts[3].id },
    // School Parents: Smiths, Patels
    { circle_id: circles[2].id, contact_id: contacts[1].id },
    { circle_id: circles[2].id, contact_id: contacts[4].id }
  ]);

  // Create demo businesses
  const businesses = await knex('businesses').insert([
    {
      name: 'Central Park Cafe',
      address: '123 Main St',
      description: 'Family-friendly cafe with great coffee and pastries',
      is_active: true
    },
    {
      name: 'Kids Play Zone',
      address: '456 Oak Ave',
      description: 'Indoor play area for children',
      is_active: true
    },
    {
      name: 'Community Center',
      address: '789 Elm Blvd',
      description: 'Local community center with events',
      is_active: true
    }
  ]).returning('*');

  // Create demo offers
  await knex('offers').insert([
    {
      business_id: businesses[0].id,
      title: '20% Off Family Brunch',
      description: 'Bring the whole family for weekend brunch and save!',
      color: '#9CAF88',
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      promo_code: 'FAMILY20',
      is_active: true,
      priority: 10
    },
    {
      business_id: businesses[1].id,
      title: 'Free Entry for Under 3s',
      description: 'Kids under 3 play free with a paying sibling',
      color: '#7BA7BC',
      is_active: true,
      priority: 5
    }
  ]);

  // Create demo events
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  await knex('events').insert([
    {
      business_id: businesses[2].id,
      title: 'Family Movie Night',
      description: 'Free outdoor movie screening for families',
      color: '#D4A574',
      event_date: nextWeek,
      event_time: '7:00 PM',
      location: 'Community Center Lawn',
      is_active: true,
      priority: 10
    },
    {
      business_id: businesses[0].id,
      title: 'Story Time Saturday',
      description: 'Kids story reading with crafts',
      color: '#9CAF88',
      event_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      event_time: '10:00 AM',
      end_time: '11:30 AM',
      location: 'Central Park Cafe',
      is_active: true,
      priority: 5
    },
    {
      business_id: null,
      title: 'Neighborhood Block Party',
      description: 'Annual block party - bring a dish to share!',
      color: '#7BA7BC',
      event_date: nextMonth,
      event_time: '2:00 PM',
      end_time: '6:00 PM',
      location: 'Oak Street (closed)',
      is_active: true,
      priority: 8
    }
  ]);

  // Create a demo invite
  const [invite] = await knex('invites').insert([
    {
      created_by_household_id: friendHouseholds[0].id,
      activity_name: 'Backyard BBQ',
      activity_type: 'food',
      proposed_date: nextWeek,
      proposed_time: 'Around 5pm',
      message: 'We\'re firing up the grill! Bring your favorite sides!',
      status: 'pending'
    }
  ]).returning('*');

  // Add demo household as recipient
  await knex('invite_recipients').insert([
    {
      invite_id: invite.id,
      household_id: demoHousehold.id,
      response: 'pending'
    }
  ]);

  console.log('✅ Demo data seeded successfully');
}
