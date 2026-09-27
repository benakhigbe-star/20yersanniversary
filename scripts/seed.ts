/**
 * Seeds ~10 demo guests and realistic sample content for local development
 * and demoing. SAFE TO RE-RUN: it deletes any existing event with the same
 * slug (which cascades to every child table — guests, responses,
 * activities, schedule, announcements, etc.) and recreates it from
 * scratch, so re-running always gives you a clean, consistent demo.
 *
 * Usage: npm run seed   (reads .env.local)
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const slug = process.env.NEXT_PUBLIC_EVENT_SLUG || 'cruise-party-2026';

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

function normalize(email: string) {
  return email.trim().toLowerCase();
}

async function main() {
  console.log(`Seeding event "${slug}"…`);

  // 1. Reset: delete any existing event with this slug (cascades everywhere).
  await supabase.from('events').delete().eq('slug', slug);

  const departureDate = new Date();
  departureDate.setDate(departureDate.getDate() + 45);
  const returnDate = new Date(departureDate);
  returnDate.setDate(returnDate.getDate() + 7);

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      slug,
      name: "Sarah & Mike's Cruise Party 2026",
      cruise_name: 'Caribbean Escape',
      cruise_line: 'Royal Caribbean',
      ship_name: 'Wonder of the Seas',
      departure_port: 'Miami, Florida',
      departure_date: departureDate.toISOString().slice(0, 10),
      departure_time: '16:00',
      return_date: returnDate.toISOString().slice(0, 10),
      return_port: 'Miami, Florida',
      logo_url: null,
      hero_image_url: null,
      welcome_message: "We can't wait to celebrate with you at sea! Everything you need for the trip lives right here.",
      theme_color: '#0f4a70',
      is_active: true,
    })
    .select('*')
    .single();

  if (eventError || !event) {
    console.error('Failed to create event:', eventError);
    process.exit(1);
  }
  const eventId = event.id as string;
  console.log(`Created event ${eventId}`);

  await supabase.from('event_settings').insert({
    event_id: eventId,
    destinations: 'Nassau, Bahamas · Perfect Day CocoCay · St. Thomas, USVI',
    boarding_info:
      'Boarding begins at 11:00 AM. Please arrive at the terminal no later than 2:00 PM with your SetSail Pass and passport ready. Boarding closes 90 minutes before departure.',
    baggage_info:
      'Leave luggage with porters at the terminal — tag it with the cabin number tags mailed to you. Carry on anything you need for the first few hours (swimwear, medication, documents).',
    dress_codes:
      'Day 1 & at sea: Resort casual. Day 3: White Party (wear white!). Day 5: Formal night — suits/cocktail dresses welcome.',
    important_reminders:
      'Passports must be valid for 6 months past the return date. Check in online 3 days before departure. Group dinner reservations are under "Sarah\'s Cruise Crew".',
    documents_info: 'Passport, cruise boarding pass (emailed 3 days prior), travel insurance certificate, any prescription documentation.',
  });

  await supabase.from('itinerary_days').insert([
    { event_id: eventId, day_number: 1, date: departureDate.toISOString().slice(0, 10), port_name: 'Miami, Florida (Departure)', departure_time: '16:30', description: 'Boarding & sail away party on the pool deck.', display_order: 0 },
    { event_id: eventId, day_number: 2, date: addDays(departureDate, 1), port_name: 'Day at Sea', description: 'Full day of onboard activities.', display_order: 1 },
    { event_id: eventId, day_number: 3, date: addDays(departureDate, 2), port_name: 'Nassau, Bahamas', arrival_time: '08:00', departure_time: '17:00', description: 'Explore downtown Nassau or book an excursion.', display_order: 2 },
    { event_id: eventId, day_number: 4, date: addDays(departureDate, 3), port_name: 'Perfect Day CocoCay', arrival_time: '07:00', departure_time: '16:00', description: "Royal Caribbean's private island — beach day!", display_order: 3 },
    { event_id: eventId, day_number: 5, date: addDays(departureDate, 4), port_name: 'St. Thomas, USVI', arrival_time: '09:00', departure_time: '18:00', description: 'Duty-free shopping and beautiful beaches.', display_order: 4 },
    { event_id: eventId, day_number: 6, date: addDays(departureDate, 5), port_name: 'Day at Sea', description: 'Relax before heading home.', display_order: 5 },
    { event_id: eventId, day_number: 7, date: returnDate.toISOString().slice(0, 10), port_name: 'Miami, Florida (Return)', arrival_time: '07:00', description: 'Disembarkation.', display_order: 6 },
  ]);

  // --- Guests ---------------------------------------------------------
  const guestSeeds = [
    { first_name: 'Sarah', last_name: 'Thompson', preferred_name: 'Sarah', email: 'sarah.thompson@example.com', group_name: 'Hosts', cabin_number: '8102', booking_reference: 'RC-88231', phone: '+1 555-010-1001' },
    { first_name: 'Michael', last_name: 'Reyes', preferred_name: 'Mike', email: 'mike.reyes@example.com', group_name: 'Hosts', cabin_number: '8102', booking_reference: 'RC-88231', phone: '+1 555-010-1002' },
    { first_name: 'Jessica', last_name: 'Nguyen', preferred_name: 'Jess', email: 'jessica.nguyen@example.com', group_name: 'College Friends', cabin_number: '7220', booking_reference: 'RC-88232', phone: '+1 555-010-1003' },
    { first_name: 'David', last_name: 'Okafor', preferred_name: null, email: 'david.okafor@example.com', group_name: 'College Friends', cabin_number: '7220', booking_reference: 'RC-88232', phone: '+1 555-010-1004' },
    { first_name: 'Emily', last_name: 'Carter', preferred_name: 'Em', email: 'emily.carter@example.com', group_name: 'Work Crew', cabin_number: '6114', booking_reference: 'RC-88233', phone: '+1 555-010-1005' },
    { first_name: 'James', last_name: 'Whitfield', preferred_name: 'Jim', email: 'james.whitfield@example.com', group_name: 'Work Crew', cabin_number: '6115', booking_reference: 'RC-88234', phone: '+1 555-010-1006' },
    { first_name: 'Priya', last_name: 'Patel', preferred_name: null, email: 'priya.patel@example.com', group_name: 'Family', cabin_number: '9021', booking_reference: 'RC-88235', phone: '+1 555-010-1007' },
    { first_name: 'Alex', last_name: 'Kim', preferred_name: null, email: 'alex.kim@example.com', group_name: 'Family', cabin_number: '9021', booking_reference: 'RC-88235', phone: '+1 555-010-1008' },
    { first_name: 'Olivia', last_name: 'Martins', preferred_name: 'Liv', email: 'olivia.martins@example.com', group_name: 'College Friends', cabin_number: '7221', booking_reference: 'RC-88236', phone: '+1 555-010-1009' },
    { first_name: 'Ryan', last_name: 'Brooks', preferred_name: null, email: 'ryan.brooks@example.com', group_name: 'Work Crew', cabin_number: '6116', booking_reference: 'RC-88237', phone: '+1 555-010-1010' },
  ];

  const { data: guests, error: guestsError } = await supabase
    .from('guests')
    .insert(
      guestSeeds.map((g) => ({
        event_id: eventId,
        first_name: g.first_name,
        last_name: g.last_name,
        preferred_name: g.preferred_name,
        email: g.email,
        email_normalized: normalize(g.email),
        phone: g.phone,
        group_name: g.group_name,
        cabin_number: g.cabin_number,
        booking_reference: g.booking_reference,
        status: 'confirmed',
        is_active: true,
      }))
    )
    .select('*');

  if (guestsError || !guests) {
    console.error('Failed to create guests:', guestsError);
    process.exit(1);
  }
  console.log(`Created ${guests.length} guests`);

  // --- Information requests -------------------------------------------
  async function createRequest(input: {
    title: string;
    description?: string;
    question_type: string;
    is_required: boolean;
    display_order: number;
    icon: string;
    config?: Record<string, unknown>;
    options?: string[];
    deadline?: string;
  }) {
    const { data: request, error } = await supabase
      .from('information_requests')
      .insert({
        event_id: eventId,
        title: input.title,
        description: input.description ?? null,
        question_type: input.question_type,
        is_required: input.is_required,
        display_order: input.display_order,
        icon: input.icon,
        config: input.config ?? {},
        deadline: input.deadline ?? null,
        is_active: true,
        allow_edit_after_submit: true,
      })
      .select('*')
      .single();
    if (error || !request) throw error;

    let options: { id: string; label: string; value: string }[] = [];
    if (input.options?.length) {
      const { data: opts, error: optError } = await supabase
        .from('request_options')
        .insert(input.options.map((label, i) => ({ request_id: request.id, label, value: label, display_order: i })))
        .select('*');
      if (optError) throw optError;
      options = opts ?? [];
    }
    return { request, options };
  }

  const deadline = addDays(new Date(), 14) + 'T00:00:00Z';

  const tshirt = await createRequest({
    title: 'T-Shirt Size',
    description: 'For your free welcome party t-shirt.',
    question_type: 'dropdown',
    is_required: true,
    display_order: 0,
    icon: '👕',
    config: { category: 'clothing' },
    options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
    deadline,
  });

  const shoe = await createRequest({
    title: 'Shoe Size',
    description: 'Used for the white party sizing only.',
    question_type: 'dropdown',
    is_required: true,
    display_order: 1,
    icon: '👟',
    config: { category: 'clothing', sizing_system: 'UK' },
    options: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    deadline,
  });

  const trouser = await createRequest({
    title: 'Trouser Size',
    description: 'Waist size, for the formal-night group order.',
    question_type: 'dropdown',
    is_required: true,
    display_order: 2,
    icon: '👖',
    config: { category: 'clothing' },
    options: ['28', '30', '32', '34', '36', '38', '40', '42'],
    deadline,
  });

  await createRequest({
    title: 'Dietary Requirements',
    description: 'Let us flag anything with the dining team in advance.',
    question_type: 'long_text',
    is_required: false,
    display_order: 3,
    icon: '🍽',
  });

  await createRequest({
    title: 'Emergency Contact',
    description: 'Name and phone number of someone we can reach if needed.',
    question_type: 'short_text',
    is_required: true,
    display_order: 4,
    icon: '🚨',
  });

  await createRequest({
    title: 'Have You Downloaded the Cruise App?',
    question_type: 'yes_no',
    is_required: false,
    display_order: 5,
    icon: '📱',
  });

  await createRequest({
    title: 'Which Excursions Interest You?',
    description: 'Select all that apply — helps us plan group bookings.',
    question_type: 'checkboxes',
    is_required: false,
    display_order: 6,
    icon: '🏝',
    options: ['Nassau City Tour', 'CocoCay Waterpark', 'St. Thomas Beach Day', 'Snorkelling Excursion', "I'll decide onboard"],
  });

  await createRequest({
    title: 'Do You Need Airport Transportation?',
    question_type: 'yes_no',
    is_required: false,
    display_order: 7,
    icon: '🚐',
  });

  // --- Guest responses (simulate ~70% completion) ----------------------
  async function respond(guestId: string, request: { id: string }, answer: { answer_text?: string; selected_option_id?: string }) {
    const { data: response } = await supabase
      .from('guest_responses')
      .insert({ event_id: eventId, request_id: request.id, guest_id: guestId, ...answer })
      .select('id')
      .single();
    return response;
  }

  const tshirtSizes = ['S', 'M', 'M', 'L', 'L', 'XL', 'M', 'S', 'L', '2XL'];
  const shoeSizes = ['6', '9', '8', '10', '7', '11', '6', '5', '8', '10'];
  const trouserSizes = ['30', '34', '32', '36', '30', '38', '32', '28', '32', '36'];

  const { data: emergencyReq } = await supabase
    .from('information_requests')
    .select('id')
    .eq('event_id', eventId)
    .eq('title', 'Emergency Contact')
    .single();

  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];
    // Everyone has an emergency contact (required) and 8/10 have submitted sizes.
    await respond(guest.id, tshirt.request, { selected_option_id: tshirt.options.find((o) => o.label === tshirtSizes[i])!.id });
    await respond(guest.id, emergencyReq as { id: string }, { answer_text: `Contact: (555) 000-${guest.cabin_number} — spouse/parent` });
    if (i < 8) {
      await respond(guest.id, shoe.request, { selected_option_id: shoe.options.find((o) => o.label === shoeSizes[i])!.id });
      await respond(guest.id, trouser.request, { selected_option_id: trouser.options.find((o) => o.label === trouserSizes[i])!.id });
    }
  }

  console.log('Seeded guest responses');

  // --- Activities -------------------------------------------------------
  await supabase.from('activities').insert([
    { event_id: eventId, name: 'Welcome Champagne Toast', description: 'Kick off the trip with the whole crew on the pool deck.', location: 'Pool Deck', activity_date: departureDate.toISOString().slice(0, 10), activity_time: '17:30', cost: 'Included', category: 'party_events', display_order: 0 },
    { event_id: eventId, name: 'White Party', description: 'Wear your best white outfit for a night under the stars.', location: 'Solarium', activity_date: addDays(departureDate, 2), activity_time: '22:00', cost: 'Included', category: 'party_events', display_order: 1 },
    { event_id: eventId, name: 'Snorkelling Excursion', description: 'Guided reef snorkel with equipment provided.', location: 'Nassau', activity_date: addDays(departureDate, 2), activity_time: '10:00', cost: '$79 per person', booking_required: true, booking_link: 'https://www.royalcaribbean.com/excursions', category: 'excursions', display_order: 2 },
    { event_id: eventId, name: 'Specialty Dinner at Chops Grille', description: "Group reservation — Sarah's Cruise Crew.", location: 'Deck 5', activity_date: addDays(departureDate, 1), activity_time: '19:30', cost: '$45 per person', booking_required: true, category: 'dining', display_order: 3 },
    { event_id: eventId, name: 'Broadway-Style Show', description: 'Live entertainment in the main theatre.', location: 'Royal Theatre', activity_date: addDays(departureDate, 1), activity_time: '20:30', cost: 'Included', category: 'entertainment', display_order: 4 },
    { event_id: eventId, name: 'Sunset Deck Party', description: 'DJ + dancing as we sail into St. Thomas.', location: 'Pool Deck', activity_date: addDays(departureDate, 4), activity_time: '18:00', cost: 'Included', category: 'nightlife', display_order: 5 },
    { event_id: eventId, name: 'Couples Spa Package', description: 'Relax with a group spa session.', location: 'Vitality Spa', cost: 'From $199', booking_required: true, category: 'spa', display_order: 6 },
    { event_id: eventId, name: 'Duty-Free Shopping Walk', description: 'Group meetup for jewellery & watches shopping in St. Thomas.', location: 'St. Thomas', activity_date: addDays(departureDate, 4), activity_time: '11:00', cost: 'Free to join', category: 'shopping', display_order: 7 },
  ]);

  // --- Schedule ----------------------------------------------------------
  await supabase.from('schedule_items').insert([
    { event_id: eventId, day_number: 1, day_label: 'Day 1 · Boarding', icon: '🚢', title: 'Boarding', item_time: '2:00 PM', display_order: 0 },
    { event_id: eventId, day_number: 1, day_label: 'Day 1 · Boarding', icon: '🍽', title: 'Group Dinner', item_time: '7:30 PM', display_order: 1 },
    { event_id: eventId, day_number: 1, day_label: 'Day 1 · Boarding', icon: '🎉', title: 'Welcome Party', item_time: '10:00 PM', display_order: 2 },
    { event_id: eventId, day_number: 2, day_label: 'Day 2 · At Sea', icon: '☕', title: 'Breakfast Meetup', item_time: '9:00 AM', display_order: 0 },
    { event_id: eventId, day_number: 2, day_label: 'Day 2 · At Sea', icon: '🏊', title: 'Pool Deck Hangout', item_time: '11:00 AM', display_order: 1 },
    { event_id: eventId, day_number: 2, day_label: 'Day 2 · At Sea', icon: '🥂', title: 'Cocktail Party', item_time: '8:00 PM', display_order: 2 },
    { event_id: eventId, day_number: 3, day_label: 'Day 3 · Nassau', icon: '🏝', title: 'Excursion Meetup', item_time: '9:30 AM', display_order: 0 },
    { event_id: eventId, day_number: 3, day_label: 'Day 3 · Nassau', icon: '🌅', title: 'All Aboard', item_time: '4:30 PM', display_order: 1 },
    { event_id: eventId, day_number: 3, day_label: 'Day 3 · Nassau', icon: '👕', title: 'White Party', item_time: '10:00 PM', display_order: 2 },
  ]);

  // --- Announcements ------------------------------------------------------
  await supabase.from('announcements').insert([
    { event_id: eventId, title: "Don't forget your T-shirt size!", body: 'Submit it by Friday so we can get the welcome shirts printed in time.', priority: 'important', is_published: true, published_at: new Date().toISOString() },
    { event_id: eventId, title: 'Group dinner moved to 8 PM', body: 'Our Chops Grille reservation on Day 2 has shifted from 7:30 PM to 8:00 PM.', priority: 'urgent', is_published: true, published_at: new Date().toISOString() },
    { event_id: eventId, title: 'Meet on Deck 6 before boarding', body: "Let's all meet at the Deck 6 terminal entrance at 1:30 PM so we can board together.", priority: 'normal', is_published: true, published_at: new Date().toISOString() },
  ]);

  // --- Useful links ---------------------------------------------------
  await supabase.from('useful_links').insert([
    { event_id: eventId, title: 'Royal Caribbean Website', icon: '🌐', url: 'https://www.royalcaribbean.com', category: 'general', display_order: 0 },
    { event_id: eventId, title: 'Online Check-In', icon: '✅', url: 'https://www.royalcaribbean.com/account/check-in', category: 'check-in', display_order: 1 },
    { event_id: eventId, title: 'Travel Insurance Portal', icon: '🛡️', url: 'https://www.royalcaribbean.com/travel-insurance', category: 'insurance', display_order: 2 },
    { event_id: eventId, title: 'Shore Excursions', icon: '🏝', url: 'https://www.royalcaribbean.com/excursions', category: 'excursions', display_order: 3 },
    { event_id: eventId, title: 'Port of Miami Information', icon: '⚓', url: 'https://www.miamidade.gov/portmiami', category: 'port-info', display_order: 4 },
    { event_id: eventId, title: 'Packing Guide (PDF)', icon: '📄', url: 'https://www.royalcaribbean.com/packing-guide.pdf', category: 'documents', display_order: 5 },
  ]);

  // --- Packing checklist --------------------------------------------------
  await supabase.from('packing_items').insert(
    [
      ['Documents', 'Passport'],
      ['Documents', 'Cruise boarding pass'],
      ['Documents', 'Travel insurance'],
      ['Health', 'Medication'],
      ['Health', 'Sunscreen'],
      ['Clothing', 'Swimwear'],
      ['Clothing', 'Formal outfit'],
      ['Clothing', 'White party outfit'],
      ['Clothing', 'Comfortable walking shoes'],
      ['Accessories', 'Sunglasses'],
      ['Electronics', 'Phone charger'],
      ['Electronics', 'Portable power bank'],
    ].map(([category, label], i) => ({ event_id: eventId, category, label, display_order: i, is_active: true }))
  );

  // --- App guide -------------------------------------------------------
  const { data: appGuide } = await supabase
    .from('app_guides')
    .insert({
      event_id: eventId,
      app_name: 'Royal Caribbean App',
      app_store_url: 'https://apps.apple.com/app/royal-caribbean-international/id1029815699',
      google_play_url: 'https://play.google.com/store/apps/details?id=com.rccl.rcros',
      intro_description: 'Everything for your cruise lives in one app — check in, book dining, and stay connected onboard.',
    })
    .select('*')
    .single();

  if (appGuide) {
    await supabase.from('app_guide_steps').insert(
      [
        'Download the App',
        'Create Your Account',
        'Add Your Cruise Booking',
        'Complete Check-In',
        'View Daily Activities',
        'Book Restaurants',
        'Book Excursions',
        'Use Onboard Messaging',
        'View Your Daily Planner',
      ].map((title, i) => ({ app_guide_id: appGuide.id, step_number: i + 1, title, display_order: i }))
    );
    await supabase.from('app_guide_features').insert(
      ['Onboard chat & messaging', 'Digital daily planner', 'Mobile check-in', 'Wayfinding maps'].map((label, i) => ({
        app_guide_id: appGuide.id,
        label,
        display_order: i,
      }))
    );
    await supabase.from('app_guide_tips').insert(
      [
        'Download the app before you leave home — onboard WiFi is slower.',
        'Enable notifications so you never miss a reservation reminder.',
      ].map((tip, i) => ({ app_guide_id: appGuide.id, tip, display_order: i }))
    );
  }

  // --- Activity log (sample "recent activity" feed) -----------------------
  await supabase.from('activity_log').insert([
    { event_id: eventId, guest_id: guests[0].id, action_type: 'response_submitted', message: `${guests[0].preferred_name} submitted their T-shirt size.` },
    { event_id: eventId, guest_id: guests[1].id, action_type: 'response_updated', message: `${guests[1].preferred_name} updated their shoe size.` },
    { event_id: eventId, guest_id: guests[2].id, action_type: 'first_login', message: `${guests[2].preferred_name || guests[2].first_name} logged in for the first time.` },
    { event_id: eventId, action_type: 'system_note', message: '3 guests have not completed their clothing information.' },
  ]);

  console.log('\n✅ Seed complete!');
  console.log(`Event slug: ${slug}`);
  console.log('Try logging in as: sarah.thompson@example.com (or any seeded guest email)');
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
