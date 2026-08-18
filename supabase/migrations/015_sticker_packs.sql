create table if not exists public.sticker_packs (
  id text primary key,
  title text not null,
  creator_name text not null,
  icon text not null,
  price_aud text not null,
  gems integer not null default 0,
  category text not null,
  description text not null,
  stickers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.sticker_packs enable row level security;

create policy "Anyone can read sticker packs"
on public.sticker_packs
for select
using (true);

insert into public.sticker_packs (id, title, creator_name, icon, price_aud, gems, category, description, stickers)
values
  ('campus-starter', 'Campus Starter Pack', 'UniAmi Team', '🎓', 'Free', 0, 'Campus Life',
    'Everyday campus essentials from lecture halls to O-Week celebrations.',
    '[
      {"id":"cs-1","emoji":"🎓","name":"Grad Cap"},{"id":"cs-2","emoji":"📚","name":"Textbooks"},
      {"id":"cs-3","emoji":"🎒","name":"Backpack"},{"id":"cs-4","emoji":"🏫","name":"Lecture Hall"},
      {"id":"cs-5","emoji":"📝","name":"Assignment"},{"id":"cs-6","emoji":"🚌","name":"Campus Shuttle"},
      {"id":"cs-7","emoji":"🥪","name":"Lunch Break"},{"id":"cs-8","emoji":"☕","name":"Flat White"},
      {"id":"cs-9","emoji":"🔔","name":"Due Date"},{"id":"cs-10","emoji":"🏆","name":"High Distinction"}
    ]'::jsonb),
  ('exam-week', 'Exam Week Moods', 'Sarah (VU)', '☕', '$1.20 AUD', 240, 'Exam Life',
    'Surviving swotvac, caffeine overload, and late-night study sessions.',
    '[
      {"id":"ew-1","emoji":"☕","name":"Triple Shot"},{"id":"ew-2","emoji":"🥱","name":"Exhausted"},
      {"id":"ew-3","emoji":"🤯","name":"Brain Fry"},{"id":"ew-4","emoji":"⏰","name":"3 AM Alarm"},
      {"id":"ew-5","emoji":"⚡","name":"Energy Boost"},{"id":"ew-6","emoji":"📄","name":"Formula Sheet"},
      {"id":"ew-7","emoji":"😭","name":"Panic Mode"},{"id":"ew-8","emoji":"🙏","name":"Pass Mark"},
      {"id":"ew-9","emoji":"🎯","name":"Final Grade"},{"id":"ew-10","emoji":"🛌","name":"Post-Exam Sleep"}
    ]'::jsonb),
  ('tech-code', 'Code & Bugs Pack', 'Alex (IT)', '💻', '$1.50 AUD', 300, 'Tech & Code',
    'For coders, debuggers, late-night git pushers, and tech innovators.',
    '[
      {"id":"tc-1","emoji":"💻","name":"Laptop"},{"id":"tc-2","emoji":"🐛","name":"Bug in Prod"},
      {"id":"tc-3","emoji":"🚀","name":"Deploy Live"},{"id":"tc-4","emoji":"⌨️","name":"Mechanical Keys"},
      {"id":"tc-5","emoji":"🐍","name":"Python Script"},{"id":"tc-6","emoji":"⚛️","name":"React Flow"},
      {"id":"tc-7","emoji":"💾","name":"Ctrl + S"},{"id":"tc-8","emoji":"🤖","name":"AI Assistant"},
      {"id":"tc-9","emoji":"📦","name":"npm Install"},{"id":"tc-10","emoji":"⚡","name":"Fast Build"}
    ]'::jsonb),
  ('cute-mascot', 'Cute Mascot Expressions', 'Ami Studio', '🦊', '$1.20 AUD', 240, 'Cute / Kawaii',
    'Adorable mascot moments to express every mood in notes and chat.',
    '[
      {"id":"cm-1","emoji":"🦊","name":"Fox Smile"},{"id":"cm-2","emoji":"🐱","name":"Cozy Cat"},
      {"id":"cm-3","emoji":"🐶","name":"Puppy Cheer"},{"id":"cm-4","emoji":"🐼","name":"Boba Panda"},
      {"id":"cm-5","emoji":"🐰","name":"Bunny Hop"},{"id":"cm-6","emoji":"🐨","name":"Koala Snuggle"},
      {"id":"cm-7","emoji":"🌸","name":"Blossom"},{"id":"cm-8","emoji":"✨","name":"Sparkles"},
      {"id":"cm-9","emoji":"💖","name":"Heart Flutter"},{"id":"cm-10","emoji":"🍙","name":"Snack Time"}
    ]'::jsonb),
  ('study-moods', 'Lo-Fi Study Moods', 'Chloe (Design)', '🎧', '$1.20 AUD', 240, 'Study Moods',
    'Relaxed beats, quiet library desks, rainy afternoons, and focus rituals.',
    '[
      {"id":"sm-1","emoji":"🎧","name":"Headphones"},{"id":"sm-2","emoji":"🌧️","name":"Rain Window"},
      {"id":"sm-3","emoji":"🍵","name":"Matcha Tea"},{"id":"sm-4","emoji":"🕯️","name":"Cozy Candle"},
      {"id":"sm-5","emoji":"📖","name":"Quiet Reading"},{"id":"sm-6","emoji":"✍️","name":"Notes"},
      {"id":"sm-7","emoji":"🧠","name":"Deep Focus"},{"id":"sm-8","emoji":"💡","name":"Eureka"}
    ]'::jsonb),
  ('campus-art', 'Creative Arts Guild', 'Liam (Arts)', '🎨', '$1.50 AUD', 300, 'Campus Art',
    'Vibrant sketches, theater masks, campus architecture, and artistic inspiration.',
    '[
      {"id":"ca-1","emoji":"🎨","name":"Palette"},{"id":"ca-2","emoji":"🖌️","name":"Brush Stroke"},
      {"id":"ca-3","emoji":"📸","name":"Analog Lens"},{"id":"ca-4","emoji":"🎭","name":"Drama Club"},
      {"id":"ca-5","emoji":"🏛️","name":"Campus Pillar"},{"id":"ca-6","emoji":"🌈","name":"Color Burst"},
      {"id":"ca-7","emoji":"🖼️","name":"Exhibition"},{"id":"ca-8","emoji":"🎷","name":"Jazz Lounge"}
    ]'::jsonb)
on conflict (id) do nothing;
