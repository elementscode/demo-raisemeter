-- demo campaigns: two organizers, four campaigns at different stages, and
-- the donations that got them there
/** @env development */

insert into users (email, name, passwordHash) values
  ('maya@raisemeter.test', 'Maya Okafor', crypt('raisemeter', genSalt('bf', 12))),
  ('jordan@raisemeter.test', 'Jordan Reyes', crypt('raisemeter', genSalt('bf', 12)));

insert into campaigns (organizerId, slug, title, summary, story, goalCents, coverAsset, featured, createdAt)
select u.id, c.slug, c.title, c.summary, c.story, c.goalCents, c.coverAsset, c.featured, now() - c.age
from (values
  ('maya@raisemeter.test', 'eastside-garden-greenhouse', 'A greenhouse for the Eastside Community Garden',
   'Forty families grow food here from April to October. A greenhouse would let us grow all year.',
   E'The Eastside Community Garden started in 2019 on a vacant lot behind the old bus depot. Today it has **42 raised beds**, a tool shed built by volunteers, and a waiting list longer than the garden itself.\n\nEvery bed goes quiet in October. A small greenhouse changes that.\n\n## What the money buys\n\n- A 20 by 30 foot polycarbonate greenhouse kit\n- A concrete footing, poured by a local contractor at cost\n- Rain barrels and a drip line so it waters itself\n- Seed trays and shelving for the spring seedling sale\n\n## Who it helps\n\nThe seedling sale funds the garden''s water bill. Winter greens go to the Eastside Food Pantry, which asked us for fresh produce in the months it gets the least.\n\nWe break ground the week after we hit our goal. Thank you for getting us this far.',
   1200000, 'garden', true, interval '38 days'),

  ('jordan@raisemeter.test', 'riverside-rescue-winter-kennels', 'Winter kennels for Riverside Animal Rescue',
   'Our outdoor kennels are not safe below freezing. Help us move 30 dogs indoors before January.',
   E'Riverside Animal Rescue is run by volunteers and takes in about **300 dogs a year**, most of them from the county shelter''s euthanasia list.\n\nLast winter we lost power twice, and our outdoor runs were too cold for the older dogs. We borrowed space in a volunteer''s garage for six weeks. We cannot do that again.\n\n## The plan\n\nWe are converting the back half of our barn into 30 insulated indoor kennels:\n\n1. Insulation and drywall for the north wall\n2. Radiant floor heating on its own circuit\n3. Washable kennel panels and drains\n4. A backup generator\n\nEvery dollar goes to materials. The labor is donated by two contractors who adopted from us.',
   2500000, 'shelter', true, interval '21 days'),

  ('maya@raisemeter.test', 'maple-street-reading-room', 'A kids'' reading room at the Maple Street Library',
   'Turning the library''s old storage room into a bright, quiet place for young readers.',
   E'The Maple Street branch serves a neighborhood with **three elementary schools** and no bookstore. After school the children''s corner is standing room only.\n\nThe branch has an unused storage room with two big windows. With new shelving, carpet, lighting and a few hundred new books, it becomes a reading room just for kids.\n\n## Where it stands\n\nWe hit our goal. Thank you. Anything raised past it goes to the book budget: the librarians have a wish list of 400 titles, starting with graphic novels and books in Spanish and Vietnamese.\n\nThe room opens on the first Saturday of November with a read-aloud and cocoa.',
   800000, 'library', true, interval '60 days'),

  ('jordan@raisemeter.test', 'lincoln-park-court', 'Resurface the Lincoln Park basketball court',
   'The court has cracks you can lose a ball in. Let''s fix it before next summer''s league.',
   E'The Lincoln Park court hosts a free youth league every summer: **eight teams, 96 kids**, games every Saturday.\n\nThe surface was last redone in 2008. The cracks are now wide enough to turn an ankle, and the city has no money for it in the next two budget cycles.\n\n## What it costs\n\n- Crack repair and a new acrylic surface: $14,000\n- New lines and two breakaway rims: $2,500\n- Two benches for the sidelines: $1,500\n\nThe parks department has approved the work. They only need us to fund it.',
   1800000, 'court', false, interval '4 days')
) as c(email, slug, title, summary, story, goalCents, coverAsset, featured, age)
join users u on u.email = c.email;

-- The donations with names and messages, the newest on each campaign's wall.
insert into donations (campaignId, amountCents, donorName, message, email, createdAt)
select c.id, d.amountCents, d.donorName, d.message, d.email, now() - d.age
from (values
  ('eastside-garden-greenhouse', 25000, 'The Nguyen family', 'Our kids learned where tomatoes come from in bed 14. Here''s to year-round greens!', 'nguyen@example.com', interval '12 minutes'),
  ('eastside-garden-greenhouse', 5000, 'Priya S.', 'So close! Let''s get this built.', 'priya@example.com', interval '47 minutes'),
  ('eastside-garden-greenhouse', 10000, null, 'For the food pantry.', 'anon1@example.com', interval '2 hours'),
  ('eastside-garden-greenhouse', 50000, 'Eastside Hardware', 'Happy to help. Come by for the shelving brackets, they''re on us.', 'store@example.com', interval '5 hours'),
  ('eastside-garden-greenhouse', 2500, 'Marcus', 'I walk past this garden every morning. Thank you for making the block better.', 'marcus@example.com', interval '9 hours'),
  ('eastside-garden-greenhouse', 15000, 'Linda & Tom Becker', 'Bed 7 says hello.', 'becker@example.com', interval '1 day'),
  ('eastside-garden-greenhouse', 3000, 'Ana Lucía', '', 'ana@example.com', interval '1 day 4 hours'),
  ('eastside-garden-greenhouse', 7500, 'Dev Patel', 'Winter kale, here we come.', 'dev@example.com', interval '2 days'),

  ('riverside-rescue-winter-kennels', 10000, 'Sam & Biscuit', 'Biscuit came home from Riverside in 2022. Best dog in the world.', 'sam@example.com', interval '6 minutes'),
  ('riverside-rescue-winter-kennels', 2500, 'Keiko T.', 'Keep them warm!', 'keiko@example.com', interval '31 minutes'),
  ('riverside-rescue-winter-kennels', 50000, null, 'In memory of Rufus.', 'anon2@example.com', interval '3 hours'),
  ('riverside-rescue-winter-kennels', 5000, 'Chris Mendoza', 'You guys do amazing work.', 'chris@example.com', interval '6 hours'),
  ('riverside-rescue-winter-kennels', 20000, 'Riverside Vet Clinic', 'Matching our staff''s donations this week.', 'vet@example.com', interval '10 hours'),
  ('riverside-rescue-winter-kennels', 3500, 'Olivia', 'From a kid who saved her allowance.', 'olivia@example.com', interval '1 day'),
  ('riverside-rescue-winter-kennels', 10000, 'The Haddad family', '', 'haddad@example.com', interval '1 day 8 hours'),
  ('riverside-rescue-winter-kennels', 7500, 'Ben W.', 'Adopted Pepper last spring. Thank you!', 'ben@example.com', interval '3 days'),

  ('maple-street-reading-room', 10000, 'Mrs. Alvarez''s 3rd grade', 'We collected cans for a month! Please buy dinosaur books.', 'alvarez@example.com', interval '20 minutes'),
  ('maple-street-reading-room', 5000, 'Grace H.', 'I learned to read in that library. Happy to give back.', 'grace@example.com', interval '4 hours'),
  ('maple-street-reading-room', 2500, null, '', 'anon3@example.com', interval '9 hours'),
  ('maple-street-reading-room', 25000, 'Friends of Maple Street Library', 'Over the top! Onward to the book list.', 'friends@example.com', interval '1 day'),
  ('maple-street-reading-room', 4000, 'Tran Van Minh', 'For the Vietnamese shelf. Cảm ơn!', 'minh@example.com', interval '2 days'),
  ('maple-street-reading-room', 10000, 'Rosa & Elena', 'Our daughters will be there on opening day.', 'rosa@example.com', interval '3 days'),

  ('lincoln-park-court', 25000, 'Coach Dre', 'Twelve summers coaching on this court. It deserves better.', 'dre@example.com', interval '15 minutes'),
  ('lincoln-park-court', 2000, 'Jaylen, age 11', 'I play point guard for the Hornets.', 'jaylen@example.com', interval '2 hours'),
  ('lincoln-park-court', 10000, 'Lincoln Park Neighbors', 'Let''s get this done!', 'neighbors@example.com', interval '7 hours'),
  ('lincoln-park-court', 5000, null, 'Fix those cracks!', 'anon4@example.com', interval '1 day'),
  ('lincoln-park-court', 3000, 'Kim R.', '', 'kim@example.com', interval '2 days')
) as d(slug, amountCents, donorName, message, email, age)
join campaigns c on c.slug = d.slug;

-- Older donations filling each campaign out to its stage: the garden near its
-- goal, the rescue about halfway, the library past it, the court just started.
insert into donations (campaignId, amountCents, donorName, message, email, createdAt)
select
  c.id,
  (array[2500, 5000, 10000, 2000, 7500, 3500, 5000, 15000])[1 + (i % 8)],
  case when i % 6 = 0 then null
       else (array['Alex', 'Jamie', 'Morgan', 'Taylor', 'Riley', 'Casey', 'Jordan', 'Avery', 'Quinn', 'Rowan', 'Sage', 'Emery'])[1 + (i % 12)]
            || ' ' || chr(65 + (i * 7) % 26) || '.'
  end,
  case when i % 5 = 0 then (array['Good luck!', 'Happy to help.', 'Love this.', 'For the neighborhood.', 'Keep going!'])[1 + (i / 5) % 5]
       else ''
  end,
  'donor' || i || '.' || c.slug || '@example.com',
  now() - s.after - (i * s.spacing)
from (values
  ('eastside-garden-greenhouse', 156, interval '2 days 6 hours', interval '6 hours'),
  ('riverside-rescue-winter-kennels', 173, interval '3 days 4 hours', interval '3 hours'),
  ('maple-street-reading-room', 123, interval '3 days 6 hours', interval '14 hours'),
  ('lincoln-park-court', 27, interval '2 days 3 hours', interval '2 hours')
) as s(slug, n, after, spacing)
join campaigns c on c.slug = s.slug
cross join lateral generate_series(1, s.n) as i;

insert into updates (campaignId, title, body, createdAt)
select c.id, u.title, u.body, now() - u.age
from (values
  ('eastside-garden-greenhouse', 'We picked a greenhouse', E'After three quotes we chose a 20 by 30 kit from a family business two towns over. It ships the week after we close.\n\nThank you all for getting us past 90%!', interval '3 days'),
  ('eastside-garden-greenhouse', 'Halfway there', 'Half funded in two weeks. The pantry is already planning a winter greens box.', interval '20 days'),
  ('riverside-rescue-winter-kennels', 'Insulation is in', E'Thanks to the first $10,000, the north wall is insulated and drywalled. Next up: the floor heating.\n\nPepper, Moose and Lulu say thanks.', interval '2 days'),
  ('maple-street-reading-room', 'We did it!', E'We passed our goal. The shelving is ordered and the carpet goes in next week.\n\nEverything from here goes straight to new books.', interval '1 day'),
  ('maple-street-reading-room', 'Paint colors chosen', 'The kids voted, and the reading room will be sky blue with a yellow ceiling.', interval '12 days')
) as u(slug, title, body, age)
join campaigns c on c.slug = u.slug;
