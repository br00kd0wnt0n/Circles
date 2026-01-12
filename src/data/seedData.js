export const currentHousehold = {
  id: 'downton',
  householdName: 'The Downtons',
  members: [
    { id: 'brook', name: 'Brook', role: 'parent', avatar: '👨' },
    { id: 'hettie', name: 'Hettie', role: 'parent', avatar: '👩' },
    { id: 'wylder', name: 'Wylder', role: 'child', avatar: '👧' },
    { id: 'eliza', name: 'Eliza', role: 'child', avatar: '👧' },
    { id: 'rocky', name: 'Rocky', role: 'pet', avatar: '🐕' }
  ],
  status: { state: 'available', timeWindow: null, note: null }
};

export const friendHouseholds = [
  {
    id: 'barretts',
    householdName: 'The Barretts',
    members: [
      { id: 'mike', name: 'Mike', role: 'parent', avatar: '👨' },
      { id: 'jen', name: 'Jen', role: 'parent', avatar: '👩' },
      { id: 'emma', name: 'Emma', role: 'child', avatar: '👧' }
    ],
    status: { state: 'available', timeWindow: null, note: 'Looking for playdate!' },
    circleIds: ['rock-academy']
  },
  {
    id: 'sachs',
    householdName: 'The Sachs',
    members: [
      { id: 'david', name: 'David', role: 'parent', avatar: '👨' },
      { id: 'lisa', name: 'Lisa', role: 'parent', avatar: '👩' },
      { id: 'sophie', name: 'Sophie', role: 'child', avatar: '👧' },
      { id: 'max', name: 'Max', role: 'child', avatar: '👦' }
    ],
    status: { state: 'open', timeWindow: '2pm - 5pm', note: null },
    circleIds: ['rock-academy', 'woodstock-elementary'] // In both Rock Academy AND school
  },
  {
    id: 'smiths',
    householdName: 'The Smiths',
    members: [
      { id: 'tom', name: 'Tom', role: 'parent', avatar: '👨' },
      { id: 'amy', name: 'Amy', role: 'parent', avatar: '👩' },
      { id: 'jack', name: 'Jack', role: 'child', avatar: '👦' }
    ],
    status: { state: 'busy', timeWindow: null, note: null },
    circleIds: ['woodstock-elementary']
  },
  {
    id: 'chase-waverly',
    householdName: 'Chase + Waverly',
    members: [
      { id: 'chase', name: 'Chase', role: 'parent', avatar: '👨' },
      { id: 'waverly', name: 'Waverly', role: 'parent', avatar: '👩' }
    ],
    status: { state: 'available', timeWindow: null, note: null },
    circleIds: ['nyc-friends']
  },
  {
    id: 'mandy',
    householdName: 'Mandy + Kids',
    members: [
      { id: 'mandy', name: 'Mandy', role: 'parent', avatar: '👩' },
      { id: 'olivia', name: 'Olivia', role: 'child', avatar: '👧' },
      { id: 'noah', name: 'Noah', role: 'child', avatar: '👦' }
    ],
    status: { state: 'open', timeWindow: null, note: 'Free after soccer' },
    circleIds: ['rock-academy', 'woodstock-elementary', 'nyc-friends'] // In all three circles
  },
  {
    id: 'sarah',
    householdName: 'Sarah + Kids',
    members: [
      { id: 'sarah', name: 'Sarah', role: 'parent', avatar: '👩' },
      { id: 'lily', name: 'Lily', role: 'child', avatar: '👧' },
      { id: 'james', name: 'James', role: 'child', avatar: '👦' }
    ],
    status: { state: 'available', timeWindow: null, note: null },
    circleIds: ['woodstock-elementary', 'nyc-friends'] // Old NYC friends who moved upstate
  },
  {
    id: 'cassie-riley',
    householdName: 'Cassie + Riley',
    members: [
      { id: 'cassie', name: 'Cassie', role: 'parent', avatar: '👩' },
      { id: 'riley', name: 'Riley', role: 'parent', avatar: '👨' }
    ],
    status: { state: 'busy', timeWindow: null, note: null },
    circleIds: ['nyc-friends']
  },
  {
    id: 'wangros',
    householdName: 'The Wangros',
    members: [
      { id: 'kevin', name: 'Kevin', role: 'parent', avatar: '👨' },
      { id: 'mei', name: 'Mei', role: 'parent', avatar: '👩' },
      { id: 'ethan', name: 'Ethan', role: 'child', avatar: '👦' }
    ],
    status: { state: 'available', timeWindow: null, note: null },
    circleIds: ['woodstock-elementary']
  },
  {
    id: 'asens',
    householdName: 'The Asens',
    members: [
      { id: 'carlos', name: 'Carlos', role: 'parent', avatar: '👨' },
      { id: 'maria', name: 'Maria', role: 'parent', avatar: '👩' },
      { id: 'sofia', name: 'Sofia', role: 'child', avatar: '👧' }
    ],
    status: { state: 'open', timeWindow: 'After 3pm', note: null },
    circleIds: ['nyc-friends', 'rock-academy'] // NYC friends whose daughter joined Rock Academy
  }
];

export const circles = [
  { id: 'rock-academy', name: 'Rock Academy', color: '#9CAF88', householdIds: ['barretts', 'sachs', 'mandy'] },
  { id: 'woodstock-elementary', name: 'Woodstock Elementary', color: '#94A3B8', householdIds: ['smiths', 'sarah', 'wangros'] },
  { id: 'nyc-friends', name: 'NYC Friends', color: '#F4A69A', householdIds: ['chase-waverly', 'cassie-riley', 'asens'] }
];

export const activities = [
  { id: 'no-plan', name: 'No Specific Plan', type: 'any', description: 'Just hanging out', goodFor: ['casual', 'flexible'], location: 'TBD' },
  { id: 'skate-time', name: 'Skate Time', type: 'active', description: 'Indoor roller skating rink', goodFor: ['kids', 'rainy day', 'birthday'], location: 'Kingston' },
  { id: 'tinker-street', name: 'Tinker Street', type: 'food', description: 'Walk around, grab food, browse shops', goodFor: ['casual', 'quick hangout'], location: 'Woodstock' },
  { id: 'olive-pool', name: 'Olive Pool', type: 'outdoor', description: 'Swimming hole', goodFor: ['summer', 'sunny day', 'kids'], location: 'West Shokan' },
  { id: 'shelter', name: 'The Shelter', type: 'food', description: 'Kid-friendly restaurant with outdoor space', goodFor: ['dinner', 'families'], location: 'Phoenicia' },
  { id: 'dubois-beach', name: 'DuBois Beach', type: 'outdoor', description: 'Beach day at the reservoir', goodFor: ['summer', 'full day', 'swimming'], location: 'Highland' },
  { id: 'opus-40', name: 'Opus 40', type: 'outdoor', description: 'Sculpture park to explore', goodFor: ['nice weather', 'walking', 'art'], location: 'Saugerties' },
  { id: 'bounce', name: 'Bounce', type: 'active', description: 'Trampoline park', goodFor: ['kids', 'rainy day', 'energy burn'], location: 'Kingston' },
  { id: 'catskill-animal', name: 'Catskill Animal Sanctuary', type: 'outdoor', description: 'Visit rescued farm animals', goodFor: ['kids', 'educational', 'nice weather'], location: 'Saugerties' },
  { id: 'backyard-hangout', name: 'Backyard Hangout', type: 'outdoor', description: 'Low-key hang at someone\'s place', goodFor: ['casual', 'easy', 'free'], location: 'Your place or theirs' },
  { id: 'movie-night', name: 'Movie Night', type: 'indoor', description: 'Watch something together', goodFor: ['evening', 'rainy day', 'cozy'], location: 'Home' }
];

export const getWeatherSuggestion = () => {
  const suggestions = [
    { weather: 'Sunny, 75°F', suggestion: 'Perfect day for DuBois Beach or a backyard hangout!', icon: '☀️' },
    { weather: 'Cloudy, 65°F', suggestion: 'Great weather for Opus 40 or Tinker Street exploring.', icon: '⛅' },
    { weather: 'Rainy, 58°F', suggestion: 'Indoor day! Skate Time or Bounce would be fun.', icon: '🌧️' }
  ];
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};

export const timeSlots = [
  { id: 'breakfast', label: 'Breakfast', time: '8am - 10am' },
  { id: 'brunch', label: 'Brunch', time: '10am - 12pm' },
  { id: 'lunch', label: 'Lunch', time: '12pm - 2pm' },
  { id: 'afternoon', label: 'Afternoon', time: '2pm - 5pm' },
  { id: 'dinner', label: 'Dinner', time: '5pm - 7pm' },
  { id: 'evening', label: 'Evening', time: '7pm+' }
];

export const localOffers = [
  {
    id: 'skate-time-deal',
    business: 'Skate Time 209',
    offer: '2-for-1 admission',
    description: 'Bring a friend, skate for free!',
    validUntil: 'Weekdays until 4pm',
    logo: '/logos/skatetime_logo.png',
    color: '#9CAF88'
  },
  {
    id: 'shelter-happy',
    business: 'The Shelter',
    offer: 'Kids eat free',
    description: 'Free kids meal with adult entrée',
    validUntil: 'Tuesdays 5-7pm',
    logo: '/logos/Shelter_logo.png',
    color: '#F4A69A'
  },
  {
    id: 'bounce-group',
    business: 'Bounce',
    offer: '20% off groups of 4+',
    description: 'Perfect for playdates!',
    validUntil: 'All week',
    logo: '/logos/Bounce_logo.png',
    color: '#94A3B8'
  },
  {
    id: 'bread-alone',
    business: 'Bread Alone',
    offer: 'Free cookie with latte',
    description: 'Freshly baked daily',
    validUntil: 'Before noon',
    logo: '/logos/BreadAlone_Logo.png',
    color: '#D4A574'
  }
];
