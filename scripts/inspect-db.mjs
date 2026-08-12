/**
 * Radiografia rápida do banco: colunas, índices, enums e contagens.
 *
 * Existe porque `db:studio` abre uma interface e o que a gente quer na maioria
 * das vezes é uma resposta em texto, conferível num terminal e colável numa
 * conversa. Não imprime nenhum dado de convidado.
 *
 * Uso: npm run db:inspect
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL não definida. Preencha o .env antes de inspecionar.');
  process.exit(1);
}

const sql = neon(url);

const columns = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'rsvps'
  ORDER BY ordinal_position`;

console.log(`=== colunas de rsvps (${columns.length}) ===`);
for (const column of columns) {
  const nullability = column.is_nullable === 'NO' ? 'NOT NULL' : '';
  console.log(`  ${column.column_name.padEnd(20)}${column.data_type.padEnd(27)}${nullability}`);
}

const indexes = await sql`
  SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'rsvps' ORDER BY indexname`;

console.log('\n=== índices ===');
for (const index of indexes) {
  console.log(`  ${index.indexname}${index.indexdef.includes('UNIQUE') ? '   [UNIQUE]' : ''}`);
}

const enums = await sql`
  SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS valores
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE t.typname IN ('attendance_decision', 'account_provider')
  GROUP BY t.typname
  ORDER BY t.typname`;

console.log('\n=== enums ===');
for (const item of enums) {
  console.log(`  ${item.typname}: ${item.valores}`);
}

const [migrations] = await sql`SELECT count(*)::int AS total FROM drizzle.__drizzle_migrations`;
const [responses] = await sql`SELECT count(*)::int AS total FROM rsvps`;

console.log(`\nmigrations aplicadas: ${migrations.total}`);
console.log(`respostas gravadas: ${responses.total}`);
