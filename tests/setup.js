// Runs before every test file. Loads .env and sets the same timezone the app uses.
require('dotenv').config();
process.env.TZ = 'Asia/Kolkata';
