-- drop old (safe re-run)
drop table if exists public.services cascade;
drop table if exists public.categories cascade;
drop table if exists public.promotions cascade;

create table public.categories (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  subtitle text,
  description text,
  sort_order int not null default 0
);

create table public.services (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  category_id bigint not null references public.categories(id) on delete cascade,
  title text not null,
  price numeric,
  description text,
  duration text,
  volume text,
  sort_order int not null default 0
);

create table public.promotions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  title text not null,
  description text,
  image_url text,
  new_price numeric,
  old_price numeric,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create index services_category_id_idx on public.services(category_id);
create index services_sort_order_idx on public.services(sort_order);
create index categories_sort_order_idx on public.categories(sort_order);

alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.promotions enable row level security;

create policy "Public read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Public read services"
  on public.services for select
  to anon, authenticated
  using (true);

create policy "Public read promotions"
  on public.promotions for select
  to anon, authenticated
  using (true);

-- allow insert/update/delete for authenticated (admin later)
create policy "Auth write categories"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

create policy "Auth write services"
  on public.services for all
  to authenticated
  using (true)
  with check (true);

create policy "Auth write promotions"
  on public.promotions for all
  to authenticated
  using (true)
  with check (true);


-- ========== SEED DATA ==========

-- categories
insert into public.categories (name, slug, subtitle, description, sort_order) values
  ('Массаж лица', 'massage', NULL, NULL, 0),
  ('Чистка лица', 'clean', NULL, NULL, 1),
  ('Брови, ресницы', 'eyes', NULL, NULL, 2),
  ('Пилинги', 'pilings', NULL, 'Пилинг используется для отшелушивания клеток кожи лица, удаляются мёртвые клетки, благодаря чему кожа становится более гладкой и красивой.', 3),
  ('Уход за кожей', 'skin', NULL, NULL, 4),
  ('Уход за лицом', 'skin_holyland', 'Holy Land (Израиль)', 'Holyland Laboratories является одной из ведущих компаний по разработке и производству профессиональной косметической продукции для ухода за любым типом кожи.', 5),
  ('Ботулинотерапия', 'botox', NULL, 'Ботулинотерапия - эффективная косметологическая методика для борьбы с мимическими морщинами. Процедура заключается во введении под кожу препаратов на основе ботулинотоксина, которые точечно воздействуют на причину образования мимических морщин.', 6),
  ('Коллагеностимулятор', 'collagen', 'Euroresearch s.r.l. (Италия)', 'Благодаря воздействию на фибробласты, происходит активная стимуляция выработки большего количества собственного коллагена. В тканях создается прочный и естественный коллагеновый каркас.', 7),
  ('Биоревитализация', 'bionic', NULL, 'Биоревитализация представляет собой внутрикожное введение гиалуроновой кислоты. Процедура способна оказать быстрое омолаживающее действие и справляется со всеми возрастными изменениями.', 8),
  ('Мезотерапия тело', 'mezo_t', NULL, 'Мезотерапия тела — это современная косметологическая процедура, которая улучшает состояние кожи и корректирует фигуру.', 9),
  ('Мезотерапия Dermaheal', 'mezo_d', 'Dermaheall (Корея)', 'Dermaheal – бренд профессиональной косметики от производителя из Южной Кореи Caregen Со. Ltd. Филлеры от компании прошли многократные проверки и допущены к использованию на территории европейских стран и России.', 10),
  ('Мезотерапия Fusion', 'mezo_f', 'Fusion (Испания)', 'Fusion Meso - это многонациональная компания, специализирующаяся на разработке, производстве и коммерциализации эстетической медицины для ухода за кожей, косметики и медицинских приборов для врачей, дерматологов и специалистов в области красоты.', 11),
  ('Мезотерапия Beautyfarma', 'mezo_b', 'Beautyfarma (Франция)', 'Компания-производитель BeautyPharmaCo была сформирована в 2008 году в Париже и вскоре стала огромным дистрибьютором и партнером большинства известных европейских производителей.', 12),
  ('Филлеры', 'fillers', 'Конурная пластика', 'В косметологии филлеры используются как инструмент контурной пластики ‒ исправление формы подбородка, носа, губ и т. д., и в антивозрастной терапии ‒ для устранения морщин и складок.', 13),
  ('Инъекции', 'inject', NULL, NULL, 14),
  ('Жидкие нити', 'liquid_strings', NULL, 'Жидкие нити — одно из новых решений эстетической медицины, помогающее восстановить упругость и эластичность кожи, разгладить морщины, а также подтянуть утратившие тонус ткани.', 15),
  ('Прокол ушей', 'ears', NULL, NULL, 16),
  ('Депиляция', 'depelation', 'на основе высококачественного воска ItalWax', NULL, 17),
  ('Дополнительные процедуры', 'external', NULL, NULL, 18);

-- services
-- Массаж лица
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Классический массаж лица', 1500, NULL, '30 мин', NULL, 0),
  ('Лимфодренажный массаж лица', 1500, NULL, '30 мин', NULL, 1),
  ('Лифтинг массаж', 1500, NULL, '30 мин', NULL, 2),
  ('Комбинированный массаж лица', 1500, NULL, '30 мин', NULL, 3),
  ('Массаж лица экспресс', 1000, NULL, '20 мин', NULL, 4)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'massage';

-- Чистка лица
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Атравматичная чистка лица жирной кожи', 3500, NULL, '90 мин', NULL, 0),
  ('Атравматичная чистка лица сухой/чувствительной кожи', 2900, NULL, '90 мин', NULL, 1),
  ('Комбинированная чистка лица', 3500, NULL, '120 м.', NULL, 2),
  ('Ультразвуковая чистка лица', 2500, NULL, '80 мин', NULL, 3),
  ('Механическая чистка лица', 3500, NULL, '90 мин', NULL, 4)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'clean';

-- Брови, ресницы
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Коррекция бровей', 500, NULL, NULL, NULL, 0),
  ('Окраска бровей', 500, NULL, NULL, NULL, 1),
  ('Окраска ресниц', 500, NULL, NULL, NULL, 2)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'eyes';

-- Пилинги
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Миндальный пилинг SESDERMA', 4000, NULL, '45 мин', NULL, 0),
  ('Салициловый пилинг SESDERMA', 4500, NULL, '45 мин', NULL, 1),
  ('Желтый пилинг SESDERMA', 4000, NULL, '45 мин', NULL, 2),
  ('Азелаиновый пилинг SESDERMA', 5000, NULL, '45 мин', NULL, 3),
  ('Пилинг Джесснера', 5000, NULL, '45 мин', NULL, 4),
  ('Гликолевый пилинг SESDERMA', 5000, NULL, '45 мин', NULL, 5),
  ('Молочный пилинг SESDERMA', 5000, NULL, '45 мин', NULL, 6),
  ('Желтый пилинг SESDERMA', 5500, NULL, '45 мин', NULL, 7),
  ('PRX-T33', 5500, NULL, '45 мин', NULL, 8),
  ('Bio Re Peel', 5500, NULL, '45 мин', NULL, 9),
  ('ABR professional (поверхностно-срединный пилинг для жирной кожи)', 5500, NULL, '45 мин', NULL, 10),
  ('ABR deep (поверхностный пилинг для всех типов кожи)', 4500, NULL, '45 мин', NULL, 11),
  ('ALPHA complex (поверхностный пилинг фруктовые кислоты)', 4000, NULL, '45 мин', NULL, 12),
  ('ABR bio (пилинг для кожи с куперозом)', 4500, NULL, '45 мин', NULL, 13),
  ('ABR lifting', 4500, NULL, '45 мин', NULL, 14),
  ('ABR forte (лечение акне)', 5000, NULL, '45 мин', NULL, 15),
  ('Hydro-peel(пилинг для сухой кожи) Beautyfarma', 3500, NULL, '45 мин', NULL, 16),
  ('Whitening peptide peel(от пигментации,с гиалуроновой кислотой) Beautyfarma', 3900, NULL, '45 мин', NULL, 17)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'pilings';

-- Уход за кожей
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Мезороллер (очищение, скраб, анестезия, сыворотка, мезороллер, маска, крем)', 4900, NULL, '60 мин', NULL, 0),
  ('Карбокситерапия (очищение, скраб, двухкомпонентная маска, сыворотка, массаж, крем)', 4900, NULL, '60 мин', NULL, 1),
  ('Стоун терапия для лица (очищение, скраб, альгинатная маска, сыворотка, массаж камнями, маска)', 4900, NULL, '60 мин', NULL, 2),
  ('Уход по типу кожи(очищение, тонизация, гоммаж, сыворотка, массаж, маска, крем)', 4500, NULL, '90 мин', NULL, 3),
  ('Микротоки(очищение, микротоки, маска, крем)', 2900, NULL, '60 мин', NULL, 4),
  ('Микротоки+уход', 4900, NULL, '60 мин', NULL, 5),
  ('Микротоки+массаж', 3900, NULL, '60 мин', NULL, 6),
  ('Жирная кожа Youtful soothing (очищение, скраб, дезинфицирующий лосьон, маска, массаж 15 минут, крем)', 3900, NULL, '60 мин', NULL, 7),
  ('Восстановление сухой кожи Renew formula (очищение, скраб, сыворотка, массаж 15 мин, маска, крем)', 3900, NULL, '70 мин', NULL, 8),
  ('Увлажнение Vitalise(очищение, скраб, сыворотка, массаж 15 мин, маска, крем)', 3900, NULL, '60 мин', NULL, 9),
  ('Лифтинг Derfectime Fiming (очищение, скраб, сыворотка, массаж 15 мин, маска, крем)', 3900, NULL, '30 мин', NULL, 10),
  ('Питание Lactolan (очищение, скраб, сыворотка, массаж 15 мин, маска, крем)', 3900, NULL, '30 мин', NULL, 11),
  ('Восстановление Juverlist Mourish (очищение, скраб, сыворотка, массаж 15 мин, маска, крем)', 3900, NULL, '20 мин', NULL, 12),
  ('Осветление Dermaling Lighting (очищение, скраб, осветляющий тоник, осветляющая сыворотка, массаж, маска, крем)', 3900, NULL, '60 мин', NULL, 13)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'skin';

-- Уход за лицом
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Процедура для жирной кожи Astrigent (очищение,дезинфицирующий тоник,очищающая сыворотка,массаж 10 мин.,маска,крем)', 3900, NULL, NULL, NULL, 0),
  ('Процедура для кожи с покраснениями Calm Derm (очищение,гоммаж,успокаивающий тоник,успокаивающая сыворотка,массаж 10 мин,маска,крем)', 3900, NULL, NULL, NULL, 1),
  ('Процедура с витамином С (очищение,скраб,сыворотка с витамином С,массаж,маска с витамином С,завершающий уход.)', 3900, NULL, NULL, NULL, 2),
  ('Восстанавливающая процедура Bio Repair (очищение,тонизация,пилинг-гоммаж,сыворотка,массаж,маска,крем)', 3900, NULL, NULL, NULL, 3),
  ('Антикуперозная процедура Calm Derm (очищение,тонизация,пилинг-гоммаж,успокаивающая сыворотка,лимфодренажный массаж, маска,крем)', 3900, NULL, NULL, NULL, 4),
  ('Процедура реабилитации после пилинга', 3900, NULL, NULL, NULL, 5),
  ('Процедура лифтинг Age Control (очищение,пилинг-гоммаж,омолаживающая сыворотка,лифтинг-массаж,маска,крем)', 3900, NULL, NULL, NULL, 6),
  ('Процедура для сухой кожи Phytomide (очищение,пилинг-гоммаж,', 3900, NULL, NULL, NULL, 7),
  ('Отбеливающая процедура Whitening очищение,скраб,осветляющая сыворотка,массаж,маска,крем)', 3900, NULL, NULL, NULL, 8)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'skin_holyland';

-- Ботулинотерапия
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Рефайнекс', 300, NULL, NULL, '1 ед', 0),
  ('Ботулакс', 300, NULL, NULL, '1 ед', 1),
  ('Kaimax', 300, NULL, NULL, '1 ед', 2),
  ('Набота', 300, NULL, NULL, '1 ед', 3),
  ('PL', 300, NULL, NULL, '1 ед', 4),
  ('Рентокс', 300, NULL, NULL, '1 ед', 5),
  ('Релатокс', 350, NULL, NULL, '1 ед', 6),
  ('Иннотокс', 300, NULL, NULL, '1 ед', 7),
  ('Дексантекс', 300, NULL, NULL, '1 ед', 8),
  ('Метокс', 300, NULL, NULL, '1 ед', 9),
  ('Meditoxin', 300, NULL, NULL, '1 ед', 10),
  ('Liztox', 300, NULL, NULL, '1 ед', 11),
  ('Toxta', 300, NULL, NULL, '1 ед', 12),
  ('Botox', 450, NULL, NULL, '1 ед', 13),
  ('Диспорт', 180, NULL, NULL, '1 ед', 14),
  ('Рефайнекс', 300, NULL, NULL, '1 ед', 15),
  ('Metox', 300, NULL, NULL, '1 ед', 16),
  ('Новакутан БТА', 350, NULL, NULL, '1 ед', 17),
  ('Corentox', 300, NULL, NULL, '1 ед', 18),
  ('Hutox', 300, NULL, NULL, '1 ед', 19),
  ('Коррекция(через 2-3 недели)', 1000, NULL, NULL, NULL, 20)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'botox';

-- Коллагеностимулятор
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Nithya', 11000, NULL, '60 мин', NULL, 0),
  ('Nithya smooth', 7500, NULL, '60 мин', NULL, 1),
  ('Nithya shield', 7500, NULL, '60 мин', NULL, 2),
  ('Nithya stimulate', 7500, NULL, '60 мин', NULL, 3),
  ('Collost MICRO', 18000, NULL, '60 мин', NULL, 4),
  ('Collapro 30+', 8800, NULL, '60 мин', NULL, 5),
  ('Collapro 40+', 9200, NULL, '60 мин', NULL, 6),
  ('Collapro 50+', 9600, NULL, '60 мин', NULL, 7),
  ('Karisma face', 22600, NULL, '60 мин', NULL, 8)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'collagen';

-- Биоревитализация
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Filorga NCTF 135 HA', 11900, NULL, NULL, '3 мл', 0),
  ('Мезоксантин', 12500, NULL, NULL, '1,5 мл', 1),
  ('Мезовартон', 12500, NULL, NULL, '1,5 мл', 2),
  ('Karisma', 19900, NULL, NULL, '2 мл', 3),
  ('Novacutan', 13400, NULL, NULL, '1,5 мл', 4),
  ('Beautelle 30+ (гиалуроновая кислота 10%) для молодой кожи и области вокруг глаз', 10500, NULL, NULL, '2 мл', 5),
  ('Beautelle 40+ (гиалуроновая кислота 15%)', 11500, NULL, NULL, '2 мл', 6),
  ('Beautelle Age+ (гиалуроновая кислота 20%)', 12500, NULL, NULL, '2 мл', 7),
  ('Beautyfarma HyalAmin (гиалуроновая кислота и аминокислоты)', 6500, NULL, NULL, '3 мл', 8),
  ('Beautyfarma Hyal (гиалуроновая кислота 3%)', 7500, NULL, NULL, '3 мл', 9),
  ('Fusion - HA (гиалуроновая кислота 2%) Испания', 5000, NULL, NULL, '3 мл', 10),
  ('Hyaron (гиалуроновая кислота 10%) Корея', 4900, NULL, NULL, '2,5 мл', 11),
  ('Gemvous (гиалуроновая кислота 20% + полинуклеотиды + ниацинамид) корея', 4900, NULL, NULL, '2,5 мл', 12),
  ('Profhilo (гиалуроновая кислота 32%) Италия', 18000, NULL, NULL, '2 мл', 13),
  ('Neauvia Mydro Deluxe (гиалуроновая кислота 18% + кальций) Италия', 8700, NULL, NULL, '2,5 мл', 14),
  ('Aquashine', 6800, NULL, NULL, '2 мл', 15),
  ('Мезоай', 11600, NULL, NULL, '1,5 мл', 16),
  ('Teosyal Redensity 1', 15000, NULL, NULL, '3 мл', 17),
  ('Revi strong', 15500, NULL, NULL, '2 мл', 18),
  ('Revi silk', 14000, NULL, NULL, '2 мл', 19),
  ('Revi style', 11800, NULL, NULL, '2 мл', 20)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'bionic';

-- Мезотерапия тело
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Lipo lab', 3500, NULL, '45 мин', NULL, 0),
  ('Dr.Lipo', 3500, NULL, '45 мин', NULL, 1),
  ('Slim X Body', 3500, NULL, '45 мин', NULL, 2),
  ('Lipo Lab V line', 3500, NULL, '45 мин', NULL, 3),
  ('V Line Sol Super', 3500, NULL, '45 мин', NULL, 4),
  ('Yellow Shot', 3500, NULL, '45 мин', NULL, 5),
  ('Aqvalix', 6500, NULL, '45 мин', NULL, 6),
  ('Bio Gel стройность+the star', 15000, NULL, '45 мин', NULL, 7),
  ('Dermaheal LL', 3500, NULL, '45 мин', NULL, 8),
  ('Lumos VS Fat', 3500, NULL, '45 мин', NULL, 9),
  ('Bio Gel стройность+Gold+White', 15000, NULL, '45 мин', NULL, 10),
  ('Alidya', 6900, NULL, '45 мин', NULL, 11),
  ('iREJU Lipo Body', 3500, NULL, '45 мин', NULL, 12),
  ('Lemonbottle for face and body', 7000, NULL, '45 мин', NULL, 13),
  ('Триада', 6500, NULL, '45 мин', NULL, 14),
  ('Tesoro body', 15000, NULL, '60 мин', NULL, 15),
  ('Devine', 17500, NULL, '60 мин', NULL, 16),
  ('B-esta HA Filler 50 мл', 22000, NULL, '60 мин', NULL, 17),
  ('B-esta HA Filler 10 мл', 12500, NULL, '60 мин', NULL, 18),
  ('Laennek', 4000, NULL, '60 мин', NULL, 19),
  ('Melsmon', 3900, NULL, '60 мин', NULL, 20),
  ('Beautyfarma gialamin', 6500, NULL, '60 мин', NULL, 21)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'mezo_t';

-- Мезотерапия Dermaheal
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Dermaheall LL (липолитик + аминокислоты)', 4900, NULL, '45 мин', NULL, 0),
  ('Dermaheal HL (для роста волос)', 4900, NULL, '45 мин', NULL, 1),
  ('Dermaheal SB (лечение пигментации)', 4900, NULL, '60 мин', NULL, 2),
  ('Dermaheal SR (регенирация для нормальной и жирной кожи)', 4900, NULL, '60 мин', NULL, 3),
  ('Dermaheal HSR (восстановление сухой и обезвоженной кожи)', 4900, NULL, '60 мин', NULL, 4),
  ('Dermaheal DARK (от темных кругов под глазами)', 4900, NULL, '35 мин', NULL, 5),
  ('Dermaheal Eyebag (от мешков под глазами)', 4900, NULL, '35 мин', NULL, 6)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'mezo_d';

-- Мезотерапия Fusion
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('F-SILORG (органический кремний)', 3900, NULL, '60 мин', NULL, 0),
  ('F-XFC (пептидный коктель для комплексного омоложения 30+)', 5000, NULL, '60 мин', NULL, 1),
  ('F-XFC FACE (антивозрастной коктель с лифтинг эффектом)', 5000, NULL, '60 мин', NULL, 2),
  ('F-XFC+ (полиревитализирующий пептидный коктель)', 7000, NULL, '60 мин', NULL, 3),
  ('F-XFC FACE (антивозрастной пептидный коктель 40+)', 7500, NULL, '60 мин', NULL, 4),
  ('F-HYDRALIX (пептидный коктель для интенсивного увлажнения)', 6500, NULL, '60 мин', NULL, 5),
  ('F-DMAE (3% диметиламиноэтанол)', 3900, NULL, '60 мин', NULL, 6),
  ('F-SLIMLIFT (коктель для уменьшения локальных жировых отложений н лице)', 3950, NULL, '60 мин', NULL, 7),
  ('F-GLOWLIFT (коктель для устранения пигментации и лифтинга кожи)', 9000, NULL, '60 мин', NULL, 8),
  ('F-HA ULTRA (коктель для интенсивного увлажнения)', 4700, NULL, '60 мин', NULL, 9),
  ('F-MELACLEAR (коктель для локального устранения пигментых пятен)', 5500, NULL, '60 мин', NULL, 10),
  ('F-EYE CONTOUR (пептидный коктель для области вокруг глаз)', 3500, NULL, '60 мин', NULL, 11),
  ('F-RADIANCE (пептидный коктель для борьбы с пигментацией)', 5000, NULL, '60 мин', NULL, 12),
  ('F-ACN (пептидный коктель для борьбы с акне)', 3550, NULL, '60 мин', NULL, 13),
  ('F-PERFECT LIPS (пептидный коктель для объема и контуров губ)', 3900, NULL, '60 мин', NULL, 14),
  ('F-COUPERIX (коктель для купероза)', 5000, NULL, '60 мин', NULL, 15),
  ('F-MESOMATRIX (пептидный комплекс для восстановления и обновления)', 5000, NULL, '60 мин', NULL, 16),
  ('F-BTX (пептидный коктель с эффектом ботокса - мезоботокс)', 5000, NULL, '60 мин', NULL, 17)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'mezo_f';

-- Мезотерапия Beautyfarma
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('BEAUTYPHARMA HYAL-AMIN (гиалуроновая кислота + аминокислоты)', 6500, NULL, NULL, NULL, 0),
  ('BEAUTYPHARMA LIFT (ДМАЕ + витамины+ олигоэлементы)', 5000, NULL, '60 мин', NULL, 1),
  ('BEAUTYPHARMA SLIM CONTROL (дренажный эффект - уменьшение обьемов)', 4500, NULL, '45 мин', NULL, 2),
  ('BEAUTYPHARMA HYAL (гиалуроновая кислота 3%)', 7000, NULL, '60 мин', NULL, 3),
  ('Beautyfarma slim active (уменьшение объемов плюс подтяжка)', 4500, NULL, '45 мин', NULL, 4)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'mezo_b';

-- Филлеры
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('DR.SUJ HAIR', 6600, NULL, NULL, '1 мл', 0),
  ('Dermalax Implant', 9800, NULL, NULL, '1 мл', 1),
  ('Dermalax Deep', 9800, NULL, NULL, '1 мл', 2),
  ('Juvederm Ultra 3', 19000, NULL, NULL, '1 мл', 3),
  ('Juvederm Ultra 4', 17800, NULL, NULL, '1 мл', 4),
  ('Juvederm Ultra Smile', 15000, NULL, NULL, '0.55 мл', 5),
  ('Juvederm Voluma', 20500, NULL, NULL, '1 мл', 6),
  ('Juvederm Volift', 20500, NULL, NULL, '1 мл', 7),
  ('Juvederm Volite', 19000, NULL, NULL, '1 мл', 8),
  ('Juvederm Volbella', 20500, NULL, NULL, '1 мл', 9),
  ('Neauvia Stimulate', 13900, NULL, NULL, '1 мл', 10),
  ('Neauvia Intense', 13900, NULL, NULL, '1 мл', 11),
  ('Neauvia Intense Lips', 13900, NULL, NULL, '1 мл', 12),
  ('Neauvia Intense LV', 13900, NULL, NULL, '1 мл', 13),
  ('Vimedica deep', 8500, NULL, NULL, '1 мл', 14),
  ('Princess Filler', 10400, NULL, NULL, '1 мл', 15),
  ('Princess Volume', 10600, NULL, NULL, '1 мл', 16),
  ('Revolax Fine', 7500, NULL, NULL, '1 мл', 17),
  ('Revolax Deep', 8500, NULL, NULL, '1 мл', 18),
  ('Revolax Sab-Q', 8500, NULL, NULL, '1 мл', 19),
  ('Sardenia Fine', 8500, NULL, NULL, '1 мл', 20),
  ('Sardenia Deep', 8500, NULL, NULL, '1 мл', 21),
  ('Sardenia Shape', 8500, NULL, NULL, '1 мл', 22),
  ('Sardenia Implant', 9500, NULL, NULL, '1 мл', 23),
  ('Stylage Special Lips', 13800, NULL, NULL, '1 мл', 24),
  ('Stylage S', 11100, NULL, NULL, '1 мл', 25),
  ('Stylage M', 12900, NULL, NULL, '1 мл', 26),
  ('Stylage L', 13500, NULL, NULL, '1 мл', 27),
  ('Stylage Xl', 15900, NULL, NULL, '1 мл', 28),
  ('Tesoro Implant', 9500, NULL, NULL, '1 мл', 29),
  ('Tesoro Sab-Q', 9500, NULL, NULL, '1 мл', 30),
  ('Tesoro Deep', 8500, NULL, NULL, '1 мл', 31),
  ('Tesoro Fine', 7500, NULL, NULL, '1 мл', 32),
  ('Neuramis Deep', 10000, NULL, NULL, '1 мл', 33),
  ('Neuramis Volume', 10000, NULL, NULL, '1 мл', 34),
  ('Vimedica fine', 7500, NULL, NULL, '1 мл', 35),
  ('Vimedica shape', 8500, NULL, NULL, '1 мл', 36),
  ('Sosum S', 7500, NULL, NULL, '1 мл', 37),
  ('Sosum M', 8500, NULL, NULL, '1 мл', 38),
  ('Sosum H', 9500, NULL, NULL, '1 мл', 39),
  ('Medeyra fine', 7500, NULL, NULL, '1 мл', 40),
  ('Medeyra deep', 8500, NULL, NULL, '1 мл', 41),
  ('Medeyra shape', 9500, NULL, NULL, '1 мл', 42),
  ('Celosome soft', 7500, NULL, NULL, '1 мл', 43),
  ('Celosome mid', 8500, NULL, NULL, '1 мл', 44),
  ('Celosome strong', 8500, NULL, NULL, '1 мл', 45),
  ('Celosome implant', 9500, NULL, NULL, '1 мл', 46),
  ('Elasty F', 7500, NULL, NULL, '1 мл', 47),
  ('Elasty D', 8500, NULL, NULL, '1 мл', 48),
  ('Elasty G', 9500, NULL, NULL, '1 мл', 49),
  ('The Jur Kiss', 10900, NULL, NULL, '1,1 мл', 50),
  ('Richesse Red Volume', 11000, NULL, NULL, '1,1 мл', 51),
  ('Hyamax extra deep', 12000, NULL, NULL, '2 мл', 52),
  ('Hyamax lips', 10000, NULL, NULL, '1 мл', 53),
  ('Hyamax volumizer', 10000, NULL, NULL, '1 мл', 54),
  ('Hyamax huavital', 12000, NULL, NULL, '2 мл', 55),
  ('Neauvia stimulate', 14900, NULL, NULL, '1 мл', 56),
  ('Neauvia intense', 14900, NULL, NULL, '1 мл', 57),
  ('Neauvia intense lips', 14900, NULL, NULL, '1 мл', 58),
  ('Neauvia FLUX', 14900, NULL, NULL, '1 мл', 59),
  ('Neauvia intense LV', 14900, NULL, NULL, '1 мл', 60),
  ('Коррекция', 1000, NULL, NULL, NULL, 61)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'fillers';

-- Инъекции
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Radiesse', 22000, NULL, NULL, '1,5 мл', 0),
  ('Radiesse', 30000, NULL, NULL, '3 мл', 1),
  ('Nithya', 13000, NULL, NULL, NULL, 2)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'inject';

-- Жидкие нити
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('AESTHEFILL', 29900, NULL, '60 мин', NULL, 0),
  ('JUVE EYES', 7500, NULL, '60 мин', NULL, 1),
  ('Sculptra', 30000, NULL, '60 мин', NULL, 2)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'liquid_strings';

-- Прокол ушей
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Прокол одного уха', 500, NULL, '20 мин', NULL, 0),
  ('Прокол двух ушей', 900, NULL, '30 мин', NULL, 1),
  ('Сережки (медецинский металл)', 500, NULL, NULL, NULL, 2),
  ('Сережки (медецинский металл) 2шт', 900, NULL, NULL, NULL, 3)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'ears';

-- Депиляция
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Ноги (до колена)', 650, NULL, NULL, NULL, 0),
  ('Ноги (полностью)', 1200, NULL, NULL, NULL, 1),
  ('Руки (до локтя)', 400, NULL, NULL, NULL, 2),
  ('Руки (полностью)', 600, NULL, NULL, NULL, 3),
  ('Подмышки', 400, NULL, NULL, NULL, 4),
  ('Усики', 350, NULL, NULL, NULL, 5),
  ('Среднее бикини', 1300, NULL, NULL, NULL, 6),
  ('Глубокое бикини', 1500, NULL, NULL, NULL, 7),
  ('Лицо', 500, NULL, NULL, NULL, 8)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'depelation';

-- Дополнительные процедуры
insert into public.services (category_id, title, price, description, duration, volume, sort_order)
select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order
from public.categories c
cross join (values
  ('Микротоковая терапия (очищение, тонизация, маска, Микротоки, крем)', 2900, NULL, '45 мин', NULL, 0)
) as v(title, price, description, duration, volume, sort_order)
where c.slug = 'external';

-- promotions
insert into public.promotions (title, description, image_url, new_price, old_price, is_active, sort_order) values
  ('Ботокс подмышечных впадин', 'Процедура подарит вам комфорт на все дни!', 'https://img.freepik.com/free-photo/skin-care-woman-with-beauty-face-touching-healthy-facial-skin-portrait-beautiful-smiling-girl-model-with-natural-makeup-touching-glowing-hydrated-skin-white-wall_176420-34251.jpg?w=512', 14900, NULL, true, 0),
  ('Контурная пластика губ', 'Увеличение, а так же коррекция губ', 'https://img.freepik.com/free-photo/woman-applying-lipstick-on-lips-with-brush-closeup_186202-5070.jpg?w=512', 9500, NULL, true, 1),
  ('Маска в подарок к любой процедуре', 'Маска в подарок при покупке к любой процедуре', 'https://img.freepik.com/free-photo/close-up-portrait-of-beautiful-young-woman-smiling-with-towels-after-take-bath-make-cosmetic-mask-on-her-face_197531-3400.jpg?w=512', 0, 750, true, 2),
  ('Миндальный пилинг', 'Пилинг для лица с миндальной (гидрокси-фенилгликолевой) кислотой', 'https://img.freepik.com/free-photo/cosmetologist-doing-face-treatment-and-applying-face-mask_1303-28042.jpg?w=512', 2500, 3100, true, 3),
  ('Биоревитализация', 'Процедура способна оказать быстрое омолаживающее действие', 'https://img.freepik.com/free-photo/hand-with-latex-glove-holding-vaccine-syringe_23-2149014339.jpg?w=512', 4500, NULL, true, 4);
