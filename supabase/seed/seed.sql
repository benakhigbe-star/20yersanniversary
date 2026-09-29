-- ============================================================================
-- Cruise Party Portal — seed data, no terminal required.
--
-- HOW TO USE:
--   1. Open your Supabase project → SQL Editor.
--   2. Edit the three admin lines right below (email, password, name).
--   3. Paste this ENTIRE file and click "Run".
--   4. That's it — guests, an event, and your admin login all exist now.
--
-- Safe to re-run: it deletes any previous demo event with the same slug
-- (which cascades to every related table) before recreating it, so running
-- this twice just resets the demo data instead of duplicating it. It will
-- NOT touch your admin account unless you re-run it (which just updates
-- the password to whatever you put below).
-- ============================================================================

DO $$
DECLARE
  -- ---- EDIT THESE THREE LINES, then run the whole script ------------------
  v_admin_email    text := 'you@example.com';
  v_admin_password text := 'ChangeThisPassword123';
  v_admin_name     text := 'Your Name';
  -- --------------------------------------------------------------------------

  v_event_slug text := 'cruise-party-2026'; -- must match NEXT_PUBLIC_EVENT_SLUG in Vercel
  v_event_id uuid;
  v_appguide_id uuid;
  v_tshirt_id uuid;
  v_shoe_id uuid;
  v_trouser_id uuid;
  v_dietary_id uuid;
  v_emergency_id uuid;
  v_app_yn_id uuid;
  v_excursions_id uuid;
  v_transport_id uuid;
  v_departure date := current_date + 45;
  v_return date := current_date + 52;
BEGIN
  -- --------------------------------------------------------------------------
  -- Admin account (independent of the event — safe even if you only want this)
  -- --------------------------------------------------------------------------
  INSERT INTO admins (email, password_hash, name, role, is_active)
  VALUES (lower(trim(v_admin_email)), crypt(v_admin_password, gen_salt('bf', 12)), v_admin_name, 'owner', true)
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, is_active = true;

  -- --------------------------------------------------------------------------
  -- Reset any previous demo data for this event slug (cascades everywhere)
  -- --------------------------------------------------------------------------
  DELETE FROM events WHERE slug = v_event_slug;

  INSERT INTO events (
    slug, name, cruise_name, cruise_line, ship_name, departure_port,
    departure_date, departure_time, return_date, return_port,
    welcome_message, theme_color, hero_image_url, is_active
  ) VALUES (
    v_event_slug, 'Sarah & Mike''s Cruise Party 2026', 'Caribbean Escape', 'Royal Caribbean', 'Wonder of the Seas',
    'Miami, Florida', v_departure, '16:00', v_return, 'Miami, Florida',
    'We can''t wait to celebrate with you at sea! Everything you need for the trip lives right here.',
    '#0f4a70',
    -- Real photo of Wonder of the Seas, Wikimedia Commons, CC BY-SA — verified to load before using it here.
    'https://upload.wikimedia.org/wikipedia/commons/0/09/Wonder_of_the_Seas_Jan_30_2025.jpg',
    true
  )
  RETURNING id INTO v_event_id;

  INSERT INTO event_settings (event_id, destinations, boarding_info, baggage_info, dress_codes, important_reminders, documents_info)
  VALUES (
    v_event_id,
    'Nassau, Bahamas · Perfect Day CocoCay · St. Thomas, USVI',
    'Boarding begins at 11:00 AM. Please arrive at the terminal no later than 2:00 PM with your SetSail Pass and passport ready. Boarding closes 90 minutes before departure.',
    'Leave luggage with porters at the terminal — tag it with the cabin number tags mailed to you. Carry on anything you need for the first few hours (swimwear, medication, documents).',
    'Day 1 & at sea: Resort casual. Day 3: White Party (wear white!). Day 5: Formal night — suits/cocktail dresses welcome.',
    'Passports must be valid for 6 months past the return date. Check in online 3 days before departure. Group dinner reservations are under "Sarah''s Cruise Crew".',
    'Passport, cruise boarding pass (emailed 3 days prior), travel insurance certificate, any prescription documentation.'
  );

  INSERT INTO itinerary_days (event_id, day_number, date, port_name, arrival_time, departure_time, description, display_order) VALUES
    (v_event_id, 1, v_departure,   'Miami, Florida (Departure)', NULL,     '16:30', 'Boarding & sail away party on the pool deck.', 0),
    (v_event_id, 2, v_departure+1, 'Day at Sea',                 NULL,     NULL,    'Full day of onboard activities.', 1),
    (v_event_id, 3, v_departure+2, 'Nassau, Bahamas',            '08:00',  '17:00', 'Explore downtown Nassau or book an excursion.', 2),
    (v_event_id, 4, v_departure+3, 'Perfect Day CocoCay',        '07:00',  '16:00', 'Royal Caribbean''s private island — beach day!', 3),
    (v_event_id, 5, v_departure+4, 'St. Thomas, USVI',           '09:00',  '18:00', 'Duty-free shopping and beautiful beaches.', 4),
    (v_event_id, 6, v_departure+5, 'Day at Sea',                 NULL,     NULL,    'Relax before heading home.', 5),
    (v_event_id, 7, v_return,      'Miami, Florida (Return)',    '07:00',  NULL,    'Disembarkation.', 6);

  -- --------------------------------------------------------------------------
  -- Guests (10 demo guests)
  -- --------------------------------------------------------------------------
  INSERT INTO guests (event_id, first_name, last_name, preferred_name, email, email_normalized, phone, group_name, cabin_number, booking_reference, status, is_active) VALUES
    (v_event_id, 'Sarah',   'Thompson', 'Sarah', 'sarah.thompson@example.com', 'sarah.thompson@example.com', '+1 555-010-1001', 'Hosts',           '8102', 'RC-88231', 'confirmed', true),
    (v_event_id, 'Michael', 'Reyes',    'Mike',  'mike.reyes@example.com',     'mike.reyes@example.com',     '+1 555-010-1002', 'Hosts',           '8102', 'RC-88231', 'confirmed', true),
    (v_event_id, 'Jessica', 'Nguyen',   'Jess',  'jessica.nguyen@example.com', 'jessica.nguyen@example.com', '+1 555-010-1003', 'College Friends', '7220', 'RC-88232', 'confirmed', true),
    (v_event_id, 'David',   'Okafor',   NULL,    'david.okafor@example.com',   'david.okafor@example.com',   '+1 555-010-1004', 'College Friends', '7220', 'RC-88232', 'confirmed', true),
    (v_event_id, 'Emily',   'Carter',   'Em',    'emily.carter@example.com',   'emily.carter@example.com',   '+1 555-010-1005', 'Work Crew',       '6114', 'RC-88233', 'confirmed', true),
    (v_event_id, 'James',   'Whitfield','Jim',   'james.whitfield@example.com','james.whitfield@example.com','+1 555-010-1006', 'Work Crew',       '6115', 'RC-88234', 'confirmed', true),
    (v_event_id, 'Priya',   'Patel',    NULL,    'priya.patel@example.com',    'priya.patel@example.com',    '+1 555-010-1007', 'Family',          '9021', 'RC-88235', 'confirmed', true),
    (v_event_id, 'Alex',    'Kim',      NULL,    'alex.kim@example.com',       'alex.kim@example.com',       '+1 555-010-1008', 'Family',          '9021', 'RC-88235', 'confirmed', true),
    (v_event_id, 'Olivia',  'Martins',  'Liv',   'olivia.martins@example.com', 'olivia.martins@example.com', '+1 555-010-1009', 'College Friends', '7221', 'RC-88236', 'confirmed', true),
    (v_event_id, 'Ryan',    'Brooks',   NULL,    'ryan.brooks@example.com',    'ryan.brooks@example.com',    '+1 555-010-1010', 'Work Crew',       '6116', 'RC-88237', 'confirmed', true);

  -- --------------------------------------------------------------------------
  -- Information requests (dynamic forms)
  -- --------------------------------------------------------------------------
  INSERT INTO information_requests (event_id, title, description, question_type, is_required, display_order, icon, config, deadline, allow_edit_after_submit, is_active)
  VALUES (v_event_id, 'T-Shirt Size', 'For your free welcome party t-shirt.', 'dropdown', true, 0, '👕', '{"category":"clothing"}'::jsonb, (current_date + 14)::timestamptz, true, true)
  RETURNING id INTO v_tshirt_id;
  INSERT INTO request_options (request_id, label, value, display_order) VALUES
    (v_tshirt_id,'XS','XS',0),(v_tshirt_id,'S','S',1),(v_tshirt_id,'M','M',2),(v_tshirt_id,'L','L',3),
    (v_tshirt_id,'XL','XL',4),(v_tshirt_id,'2XL','2XL',5),(v_tshirt_id,'3XL','3XL',6),(v_tshirt_id,'4XL','4XL',7);

  INSERT INTO information_requests (event_id, title, description, question_type, is_required, display_order, icon, config, deadline, allow_edit_after_submit, is_active)
  VALUES (v_event_id, 'Shoe Size', 'Used for the white party sizing only.', 'dropdown', true, 1, '👟', '{"category":"clothing","sizing_system":"UK"}'::jsonb, (current_date + 14)::timestamptz, true, true)
  RETURNING id INTO v_shoe_id;
  INSERT INTO request_options (request_id, label, value, display_order) VALUES
    (v_shoe_id,'4','4',0),(v_shoe_id,'5','5',1),(v_shoe_id,'6','6',2),(v_shoe_id,'7','7',3),
    (v_shoe_id,'8','8',4),(v_shoe_id,'9','9',5),(v_shoe_id,'10','10',6),(v_shoe_id,'11','11',7),(v_shoe_id,'12','12',8);

  INSERT INTO information_requests (event_id, title, description, question_type, is_required, display_order, icon, config, deadline, allow_edit_after_submit, is_active)
  VALUES (v_event_id, 'Trouser Size', 'Waist size, for the formal-night group order.', 'dropdown', true, 2, '👖', '{"category":"clothing"}'::jsonb, (current_date + 14)::timestamptz, true, true)
  RETURNING id INTO v_trouser_id;
  INSERT INTO request_options (request_id, label, value, display_order) VALUES
    (v_trouser_id,'28','28',0),(v_trouser_id,'30','30',1),(v_trouser_id,'32','32',2),(v_trouser_id,'34','34',3),
    (v_trouser_id,'36','36',4),(v_trouser_id,'38','38',5),(v_trouser_id,'40','40',6),(v_trouser_id,'42','42',7);

  INSERT INTO information_requests (event_id, title, description, question_type, is_required, display_order, icon, is_active)
  VALUES (v_event_id, 'Dietary Requirements', 'Let us flag anything with the dining team in advance.', 'long_text', false, 3, '🍽', true)
  RETURNING id INTO v_dietary_id;

  INSERT INTO information_requests (event_id, title, description, question_type, is_required, display_order, icon, is_active)
  VALUES (v_event_id, 'Emergency Contact', 'Name and phone number of someone we can reach if needed.', 'short_text', true, 4, '🚨', true)
  RETURNING id INTO v_emergency_id;

  INSERT INTO information_requests (event_id, title, question_type, is_required, display_order, icon, is_active)
  VALUES (v_event_id, 'Have You Downloaded the Cruise App?', 'yes_no', false, 5, '📱', true)
  RETURNING id INTO v_app_yn_id;

  INSERT INTO information_requests (event_id, title, description, question_type, is_required, display_order, icon, is_active)
  VALUES (v_event_id, 'Which Excursions Interest You?', 'Select all that apply — helps us plan group bookings.', 'checkboxes', false, 6, '🏝', true)
  RETURNING id INTO v_excursions_id;
  INSERT INTO request_options (request_id, label, value, display_order) VALUES
    (v_excursions_id,'Nassau City Tour','Nassau City Tour',0),
    (v_excursions_id,'CocoCay Waterpark','CocoCay Waterpark',1),
    (v_excursions_id,'St. Thomas Beach Day','St. Thomas Beach Day',2),
    (v_excursions_id,'Snorkelling Excursion','Snorkelling Excursion',3),
    (v_excursions_id,'I''ll decide onboard','I''ll decide onboard',4);

  INSERT INTO information_requests (event_id, title, question_type, is_required, display_order, icon, is_active)
  VALUES (v_event_id, 'Do You Need Airport Transportation?', 'yes_no', false, 7, '🚐', true)
  RETURNING id INTO v_transport_id;

  -- --------------------------------------------------------------------------
  -- Sample responses (~80% completion, so the dashboard/tracking look real)
  -- --------------------------------------------------------------------------
  INSERT INTO guest_responses (event_id, request_id, guest_id, selected_option_id)
  SELECT v_event_id, v_tshirt_id, g.id, o.id
  FROM (VALUES
    ('sarah.thompson@example.com','S'), ('mike.reyes@example.com','M'), ('jessica.nguyen@example.com','M'),
    ('david.okafor@example.com','L'), ('emily.carter@example.com','L'), ('james.whitfield@example.com','XL'),
    ('priya.patel@example.com','M'), ('alex.kim@example.com','S'), ('olivia.martins@example.com','L'),
    ('ryan.brooks@example.com','2XL')
  ) AS m(email, size)
  JOIN guests g ON g.event_id = v_event_id AND g.email_normalized = m.email
  JOIN request_options o ON o.request_id = v_tshirt_id AND o.label = m.size;

  INSERT INTO guest_responses (event_id, request_id, guest_id, selected_option_id)
  SELECT v_event_id, v_shoe_id, g.id, o.id
  FROM (VALUES
    ('sarah.thompson@example.com','6'), ('mike.reyes@example.com','9'), ('jessica.nguyen@example.com','8'),
    ('david.okafor@example.com','10'), ('emily.carter@example.com','7'), ('james.whitfield@example.com','11'),
    ('priya.patel@example.com','6'), ('alex.kim@example.com','5')
  ) AS m(email, size)
  JOIN guests g ON g.event_id = v_event_id AND g.email_normalized = m.email
  JOIN request_options o ON o.request_id = v_shoe_id AND o.label = m.size;

  INSERT INTO guest_responses (event_id, request_id, guest_id, selected_option_id)
  SELECT v_event_id, v_trouser_id, g.id, o.id
  FROM (VALUES
    ('sarah.thompson@example.com','30'), ('mike.reyes@example.com','34'), ('jessica.nguyen@example.com','32'),
    ('david.okafor@example.com','36'), ('emily.carter@example.com','30'), ('james.whitfield@example.com','38'),
    ('priya.patel@example.com','32'), ('alex.kim@example.com','28')
  ) AS m(email, size)
  JOIN guests g ON g.event_id = v_event_id AND g.email_normalized = m.email
  JOIN request_options o ON o.request_id = v_trouser_id AND o.label = m.size;

  INSERT INTO guest_responses (event_id, request_id, guest_id, answer_text)
  SELECT v_event_id, v_emergency_id, g.id, 'Contact: (555) 000-' || g.cabin_number || ' — spouse/parent'
  FROM guests g WHERE g.event_id = v_event_id;

  -- --------------------------------------------------------------------------
  -- Activities, schedule, announcements, links, packing, app guide
  -- --------------------------------------------------------------------------
  INSERT INTO activities (event_id, name, description, location, activity_date, activity_time, cost, booking_required, booking_link, category, display_order) VALUES
    (v_event_id, 'Welcome Champagne Toast', 'Kick off the trip with the whole crew on the pool deck.', 'Pool Deck', v_departure, '17:30', 'Included', false, NULL, 'party_events', 0),
    (v_event_id, 'White Party', 'Wear your best white outfit for a night under the stars.', 'Solarium', v_departure+2, '22:00', 'Included', false, NULL, 'party_events', 1),
    (v_event_id, 'Snorkelling Excursion', 'Guided reef snorkel with equipment provided.', 'Nassau', v_departure+2, '10:00', '$79 per person', true, 'https://www.royalcaribbean.com/excursions', 'excursions', 2),
    (v_event_id, 'Specialty Dinner at Chops Grille', 'Group reservation — Sarah''s Cruise Crew.', 'Deck 5', v_departure+1, '19:30', '$45 per person', true, NULL, 'dining', 3),
    (v_event_id, 'Broadway-Style Show', 'Live entertainment in the main theatre.', 'Royal Theatre', v_departure+1, '20:30', 'Included', false, NULL, 'entertainment', 4),
    (v_event_id, 'Sunset Deck Party', 'DJ + dancing as we sail into St. Thomas.', 'Pool Deck', v_departure+4, '18:00', 'Included', false, NULL, 'nightlife', 5),
    (v_event_id, 'Couples Spa Package', 'Relax with a group spa session.', 'Vitality Spa', NULL, NULL, 'From $199', true, NULL, 'spa', 6),
    (v_event_id, 'Duty-Free Shopping Walk', 'Group meetup for jewellery & watches shopping in St. Thomas.', 'St. Thomas', v_departure+4, '11:00', 'Free to join', false, NULL, 'shopping', 7);

  INSERT INTO schedule_items (event_id, day_number, day_label, icon, title, item_time, display_order) VALUES
    (v_event_id, 1, 'Day 1 · Boarding', '🚢', 'Boarding', '2:00 PM', 0),
    (v_event_id, 1, 'Day 1 · Boarding', '🍽', 'Group Dinner', '7:30 PM', 1),
    (v_event_id, 1, 'Day 1 · Boarding', '🎉', 'Welcome Party', '10:00 PM', 2),
    (v_event_id, 2, 'Day 2 · At Sea', '☕', 'Breakfast Meetup', '9:00 AM', 0),
    (v_event_id, 2, 'Day 2 · At Sea', '🏊', 'Pool Deck Hangout', '11:00 AM', 1),
    (v_event_id, 2, 'Day 2 · At Sea', '🥂', 'Cocktail Party', '8:00 PM', 2),
    (v_event_id, 3, 'Day 3 · Nassau', '🏝', 'Excursion Meetup', '9:30 AM', 0),
    (v_event_id, 3, 'Day 3 · Nassau', '🌅', 'All Aboard', '4:30 PM', 1),
    (v_event_id, 3, 'Day 3 · Nassau', '👕', 'White Party', '10:00 PM', 2);

  INSERT INTO announcements (event_id, title, body, priority, is_published, published_at) VALUES
    (v_event_id, 'Don''t forget your T-shirt size!', 'Submit it by Friday so we can get the welcome shirts printed in time.', 'important', true, now()),
    (v_event_id, 'Group dinner moved to 8 PM', 'Our Chops Grille reservation on Day 2 has shifted from 7:30 PM to 8:00 PM.', 'urgent', true, now()),
    (v_event_id, 'Meet on Deck 6 before boarding', 'Let''s all meet at the Deck 6 terminal entrance at 1:30 PM so we can board together.', 'normal', true, now());

  INSERT INTO useful_links (event_id, title, icon, url, category, display_order) VALUES
    (v_event_id, 'Royal Caribbean Website', '🌐', 'https://www.royalcaribbean.com', 'general', 0),
    (v_event_id, 'Online Check-In', '✅', 'https://www.royalcaribbean.com/account/check-in', 'check-in', 1),
    (v_event_id, 'Travel Insurance Portal', '🛡️', 'https://www.royalcaribbean.com/travel-insurance', 'insurance', 2),
    (v_event_id, 'Shore Excursions', '🏝', 'https://www.royalcaribbean.com/excursions', 'excursions', 3),
    (v_event_id, 'Port of Miami Information', '⚓', 'https://www.miamidade.gov/portmiami', 'port-info', 4);

  INSERT INTO packing_items (event_id, category, label, display_order) VALUES
    (v_event_id, 'Documents', 'Passport', 0),
    (v_event_id, 'Documents', 'Cruise boarding pass', 1),
    (v_event_id, 'Documents', 'Travel insurance', 2),
    (v_event_id, 'Health', 'Medication', 3),
    (v_event_id, 'Health', 'Sunscreen', 4),
    (v_event_id, 'Clothing', 'Swimwear', 5),
    (v_event_id, 'Clothing', 'Formal outfit', 6),
    (v_event_id, 'Clothing', 'White party outfit', 7),
    (v_event_id, 'Clothing', 'Comfortable walking shoes', 8),
    (v_event_id, 'Accessories', 'Sunglasses', 9),
    (v_event_id, 'Electronics', 'Phone charger', 10),
    (v_event_id, 'Electronics', 'Portable power bank', 11);

  INSERT INTO app_guides (event_id, app_name, app_store_url, google_play_url, intro_description)
  VALUES (
    v_event_id, 'Royal Caribbean App',
    'https://apps.apple.com/app/royal-caribbean-international/id1029815699',
    'https://play.google.com/store/apps/details?id=com.rccl.rcros',
    'Everything for your cruise lives in one app — check in, book dining, and stay connected onboard.'
  )
  RETURNING id INTO v_appguide_id;

  INSERT INTO app_guide_steps (app_guide_id, step_number, title, display_order) VALUES
    (v_appguide_id, 1, 'Download the App', 0),
    (v_appguide_id, 2, 'Create Your Account', 1),
    (v_appguide_id, 3, 'Add Your Cruise Booking', 2),
    (v_appguide_id, 4, 'Complete Check-In', 3),
    (v_appguide_id, 5, 'View Daily Activities', 4),
    (v_appguide_id, 6, 'Book Restaurants', 5),
    (v_appguide_id, 7, 'Book Excursions', 6),
    (v_appguide_id, 8, 'Use Onboard Messaging', 7),
    (v_appguide_id, 9, 'View Your Daily Planner', 8);

  INSERT INTO app_guide_features (app_guide_id, label, display_order) VALUES
    (v_appguide_id, 'Onboard chat & messaging', 0),
    (v_appguide_id, 'Digital daily planner', 1),
    (v_appguide_id, 'Mobile check-in', 2),
    (v_appguide_id, 'Wayfinding maps', 3);

  INSERT INTO app_guide_tips (app_guide_id, tip, display_order) VALUES
    (v_appguide_id, 'Download the app before you leave home — onboard WiFi is slower.', 0),
    (v_appguide_id, 'Enable notifications so you never miss a reservation reminder.', 1);

  -- --------------------------------------------------------------------------
  -- Sample pending invitation requests (people the organiser didn't have emails for)
  -- --------------------------------------------------------------------------
  INSERT INTO signup_requests (event_id, first_name, last_name, email, email_normalized, note) VALUES
    (v_event_id, 'Marcus', 'Bell', 'marcus.bell@example.com', 'marcus.bell@example.com', 'I''m Jess''s plus-one, she said to sign up here!');
  INSERT INTO signup_requests (event_id, first_name, last_name, preferred_name, email, email_normalized) VALUES
    (v_event_id, 'Tasha', 'Reid', 'Tash', 'tasha.reid@example.com', 'tasha.reid@example.com');

  -- --------------------------------------------------------------------------
  -- Sample activity log (admin dashboard "recent activity" feed)
  -- --------------------------------------------------------------------------
  INSERT INTO activity_log (event_id, guest_id, action_type, message)
  SELECT v_event_id, g.id, 'response_submitted', 'Sarah submitted their T-shirt size.'
  FROM guests g WHERE g.event_id = v_event_id AND g.email_normalized = 'sarah.thompson@example.com';

  INSERT INTO activity_log (event_id, guest_id, action_type, message)
  SELECT v_event_id, g.id, 'first_login', 'Jess logged in for the first time.'
  FROM guests g WHERE g.event_id = v_event_id AND g.email_normalized = 'jessica.nguyen@example.com';

  INSERT INTO activity_log (event_id, action_type, message)
  VALUES (v_event_id, 'system_note', '2 guests have not completed their clothing information.');

  RAISE NOTICE 'Seed complete for event slug "%": admin=%, event_id=%', v_event_slug, lower(trim(v_admin_email)), v_event_id;
END $$;
