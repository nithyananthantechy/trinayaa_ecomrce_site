import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/trinayaa.db');
const camps = db.prepare("SELECT id, code, name FROM campaigns").all();
console.log('Campaigns in DB:', camps);

