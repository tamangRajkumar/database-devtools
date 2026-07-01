export type PlaceholderTable = {
  name: string;
  rowCount: number;
};

export type PlaceholderColumn = {
  name: string;
  type: string;
  nullable: boolean;
};

export type PlaceholderTableSchema = {
  name: string;
  columns: PlaceholderColumn[];
};

export const PLACEHOLDER_TABLES: PlaceholderTable[] = [
  { name: 'users', rowCount: 1284 },
  { name: 'bookings', rowCount: 532 },
  { name: 'sessions', rowCount: 89 },
  { name: 'migrations', rowCount: 12 },
];

export const PLACEHOLDER_SCHEMA: PlaceholderTableSchema[] = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'email', type: 'TEXT', nullable: false },
      { name: 'name', type: 'TEXT', nullable: true },
      { name: 'created_at', type: 'INTEGER', nullable: false },
    ],
  },
  {
    name: 'bookings',
    columns: [
      { name: 'id', type: 'INTEGER', nullable: false },
      { name: 'user_id', type: 'INTEGER', nullable: false },
      { name: 'status', type: 'TEXT', nullable: false },
      { name: 'starts_at', type: 'INTEGER', nullable: false },
    ],
  },
  {
    name: 'sessions',
    columns: [
      { name: 'id', type: 'TEXT', nullable: false },
      { name: 'user_id', type: 'INTEGER', nullable: false },
      { name: 'expires_at', type: 'INTEGER', nullable: false },
    ],
  },
];

export const PLACEHOLDER_SAMPLE_SQL = `SELECT u.email, COUNT(b.id) AS booking_count
FROM users u
LEFT JOIN bookings b ON b.user_id = u.id
GROUP BY u.id
ORDER BY booking_count DESC
LIMIT 10;`;

export const PLACEHOLDER_QUERY_RESULT = {
  columns: ['email', 'booking_count'],
  rows: [
    ['alice@example.com', '42'],
    ['bob@example.com', '31'],
    ['carol@example.com', '18'],
    ['dave@example.com', '7'],
  ],
};
