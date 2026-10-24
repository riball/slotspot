# SlotSpot

Local appointment booking. Customers search for a business, pick a service and a free time, and book it. Owners set their opening hours and services and see the day's schedule.

The main point of the project is that **two people can never book the same slot**, even if they click at the same moment. Each booking runs in a database transaction that locks the business row first (see "How double-booking is prevented" below).

## Stack

- Node.js 20+, Express 5
- MySQL 8, using `mysql2` with a connection pool and plain SQL (no ORM)
- Frontend: plain HTML, CSS, and jQuery (served from `node_modules`, no CDN)
- Login with `express-session` and `bcryptjs`
- Security: `helmet` (headers and CSP), `express-rate-limit` on login and register
- Tests: Jest and Supertest

## Setup

1. **Install dependencies** (inside the project folder):

       npm install

2. **Create your settings file:**

       cp .env.example .env

   Open `.env` and set `DB_PASSWORD` to your MySQL root password.

3. **Create the databases and tables.** Open the MySQL prompt:

       mysql -u root -p

   Then run:

       CREATE DATABASE slotspot;
       CREATE DATABASE slotspot_test;
       USE slotspot;
       SOURCE sql/schema.sql;

4. **Create the demo accounts:**

       npm run seed:users

   This creates `owner@example.com` (password `demo-owner-123`) and `customer@example.com` (password `demo-customer-123`).

5. **Load the sample data.** Back in the MySQL prompt:

       SOURCE sql/seed.sql;

   Then `exit`.

6. **Start the server:**

       npm start

   Open http://localhost:3000.

## Try it

- Log in as the customer, search for "Jayanagar", open the business, pick a service and tomorrow's date. Greyed-out times are already booked.
- Book a free slot, then open **My bookings** and cancel it.
- Log in as the owner to see the **Owner** page, with today's schedule, services, and opening hours.

## Running the tests

The tests use `slotspot_test` and wipe its tables each run, so they never touch your real data.

    npm test

The suite covers:

- Slot generation: starts every 30 minutes, taken slots, past times, closed days
- Booking a free slot succeeds, a taken slot fails, and outside-hours or off-grid times are rejected
- **Two simultaneous bookings of the same slot: exactly one succeeds**
- Cancelling more than 2 hours ahead works, and cancelling later is refused
- Protected routes require login, and errors come back as `{ "message": "..." }`

## How double-booking is prevented

`src/services/bookingService.js` runs each booking like this:

1. Start a transaction.
2. `SELECT ... FOR UPDATE` on the business row. If a second request for the same business arrives, it waits here until the first one commits.
3. Check the service, opening hours, and whether any confirmed booking overlaps the new time.
4. Insert the booking and commit. If anything fails, roll back.

Because the lock is taken before the overlap check, the check always sees the latest committed bookings. The test "two simultaneous bookings" runs two requests at once to prove it.

## Project layout

    public/            HTML pages, CSS, and browser JavaScript (jQuery)
    src/
      app.js           Express setup, security headers, routes
      server.js        starts the server
      db.js            MySQL connection pool
      routes/          read requests, validate input, call services, send JSON
      services/        business rules (slotService, bookingService)
      repositories/    the only code that writes SQL
      middleware/      login and owner checks, error formatting
      lib/             time helpers, input helpers, HttpError
    sql/               schema.sql (tables) and seed.sql (sample data)
    scripts/           seed-users.js (demo accounts)
    tests/             Jest tests

## Known limits

- Each owner account manages one business.
- Sample businesses other than "Jayanagar Hair Studio" have no owner account. They can be booked but not managed.
- Sessions are stored in memory, so logging in again is needed after a server restart. Fine for a demo; use a session store such as Redis in production.
- All times are Bengaluru local time (`Asia/Kolkata`). There's no timezone conversion for customers elsewhere.
- No email confirmations or payments.
