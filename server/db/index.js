import { Pool } from 'pg';
import { config } from 'dotenv';

config(); // load .env variables

const pool = new Pool();

export function query(text, params, callback) {
  {
    return pool.query(text, params, callback);
  }
}
