export const CATEGORIES = ['All', 'Prints', 'Stickers', 'Keychains', 'Badges', 'Other'];

export const inventoryItems = [
  {
    id: '1',
    name: 'Gojo Print A4',
    category: 'Prints',
    productionCost: 2.50,
    sellingPrice: 15.00,
    stock: 45,
  },
  {
    id: '2',
    name: 'Naruto Sticker Pack',
    category: 'Stickers',
    productionCost: 0.80,
    sellingPrice: 5.00,
    stock: 120,
  },
  {
    id: '3',
    name: 'Sailor Moon Keychain',
    category: 'Keychains',
    productionCost: 1.50,
    sellingPrice: 8.00,
    stock: 30,
  },
  {
    id: '4',
    name: 'My Hero Badge Set',
    category: 'Badges',
    productionCost: 1.00,
    sellingPrice: 6.00,
    stock: 0,
  },
  {
    id: '5',
    name: 'Spy x Family Print A3',
    category: 'Prints',
    productionCost: 3.00,
    sellingPrice: 20.00,
    stock: 18,
  },
];

export const EXPENSE_CATEGORIES = ['Booth Fee', 'Transportation', 'Food', 'Hotel', 'Supplies', 'Other'];

export const EVENT_STATUSES = ['All', 'Upcoming', 'Active', 'Past'];

export const events = [
  {
    id: '1',
    name: 'Anime Expo 2026',
    date: '2026-07-02',
    endDate: '2026-07-05',
    location: 'Los Angeles Convention Center',
    status: 'upcoming',
    expenses: [
      { id: 'e1', category: 'Booth Fee', amount: 500.00 },
      { id: 'e2', category: 'Hotel', amount: 450.00 },
      { id: 'e3', category: 'Transportation', amount: 120.00 },
    ],
  },
  {
    id: '2',
    name: 'Artist Alley Summer Market',
    date: '2026-05-18',
    endDate: '2026-05-18',
    location: 'Portland, OR',
    status: 'upcoming',
    expenses: [
      { id: 'e4', category: 'Booth Fee', amount: 150.00 },
      { id: 'e5', category: 'Food', amount: 40.00 },
    ],
  },
  {
    id: '3',
    name: 'Spring Comic Fest',
    date: '2026-04-10',
    endDate: '2026-04-12',
    location: 'Seattle Convention Center',
    status: 'active',
    expenses: [
      { id: 'e6', category: 'Booth Fee', amount: 300.00 },
      { id: 'e7', category: 'Hotel', amount: 280.00 },
      { id: 'e8', category: 'Food', amount: 65.00 },
      { id: 'e9', category: 'Supplies', amount: 45.00 },
    ],
  },
  {
    id: '4',
    name: 'Dokomi 2025',
    date: '2025-06-28',
    endDate: '2025-06-29',
    location: 'Düsseldorf, Germany',
    status: 'past',
    expenses: [
      { id: 'e10', category: 'Booth Fee', amount: 400.00 },
      { id: 'e11', category: 'Transportation', amount: 850.00 },
      { id: 'e12', category: 'Hotel', amount: 320.00 },
      { id: 'e13', category: 'Food', amount: 95.00 },
    ],
  },
  {
    id: '5',
    name: 'Comic-Con San Diego',
    date: '2026-07-23',
    endDate: '2026-07-26',
    location: 'San Diego Convention Center',
    status: 'upcoming',
    expenses: [],
  },
];

