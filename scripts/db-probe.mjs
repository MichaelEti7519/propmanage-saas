import 'dotenv/config';
import pg from 'pg';

const url = new URL(process.env.DATABASE_URL ?? '');
console.log('host=' + url.hostname, 'port=' + url.port, 'db=' + url.pathname, 'params=' + url.search);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const result = await client.query('select count(*)::int as users from "User"');
  console.log('pg ok users=' + result.rows[0].users);
} catch (error) {
  console.log('pg err ' + error.message);
} finally {
  await client.end().catch(() => {});
}
