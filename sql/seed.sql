-- Sample businesses, services, hours, and bookings.
-- Run after schema.sql and `npm run seed:users` (bookings need the demo customer).

INSERT INTO businesses (id, owner_id, name, category, area, address, description) VALUES
(1, (SELECT id FROM users WHERE email = 'owner@example.com'), 'Jayanagar Hair Studio', 'Salon', 'Jayanagar', '12 4th Block, Jayanagar, Bengaluru', 'Cuts, colour and beard trims.'),
(2, NULL, 'Indiranagar Cuts and Colour', 'Salon', 'Indiranagar', '45 100 Feet Road, Indiranagar, Bengaluru', 'Modern cuts and colour, by appointment.'),
(3, NULL, 'Koramangala Maths Tutors', 'Tutoring', 'Koramangala', '7 80 Feet Road, Koramangala, Bengaluru', 'School and college maths, one to one.'),
(4, NULL, 'HSR Japanese Conversation Room', 'Tutoring', 'HSR Layout', '18 Sector 2, HSR Layout, Bengaluru', 'Practise speaking Japanese with a tutor.'),
(5, NULL, 'Whitefield Physio Clinic', 'Physiotherapy', 'Whitefield', '3 ITPL Main Road, Whitefield, Bengaluru', 'Sports and back physiotherapy.'),
(6, NULL, 'Basavanagudi Phone Repair', 'Repair', 'Basavanagudi', '22 Bull Temple Road, Basavanagudi, Bengaluru', 'Screen and battery repairs.');

INSERT INTO services (id, business_id, name, duration_minutes, price) VALUES
(1, 1, 'Haircut', 30, 300),
(2, 1, 'Haircut and beard trim', 60, 550),
(3, 2, 'Womens cut', 60, 800),
(4, 3, 'Maths tutoring', 60, 600),
(5, 4, 'Japanese conversation', 60, 700),
(6, 5, 'Physiotherapy session', 45, 1000),
(7, 6, 'Screen repair check', 30, 150);

INSERT INTO opening_hours (business_id, weekday, opens_at, closes_at)
SELECT b.id, d.weekday, '10:00:00', '19:00:00'
FROM businesses b
CROSS JOIN (
    SELECT 0 AS weekday UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) d;

UPDATE opening_hours SET opens_at = NULL, closes_at = NULL WHERE business_id = 6 AND weekday = 0;

-- Bookings for tomorrow, so the grid shows taken slots straight away.
INSERT INTO bookings (business_id, service_id, customer_id, start_at, end_at, status) VALUES
(1, 1, (SELECT id FROM users WHERE email = 'customer@example.com'),
    TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '10:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '10:30:00'), 'confirmed'),
(1, 2, (SELECT id FROM users WHERE email = 'customer@example.com'),
    TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '11:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '12:00:00'), 'confirmed'),
(3, 4, (SELECT id FROM users WHERE email = 'customer@example.com'),
    TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '15:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '16:00:00'), 'confirmed');
