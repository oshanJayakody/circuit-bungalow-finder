-- Sri Lankan districts and commonly used town/area choices for bungalow listings.
-- Run once in Supabase SQL Editor. Bungalow rows continue to store district/town as text.
create table if not exists public.sri_lanka_districts (
  name text primary key
);

create table if not exists public.sri_lanka_towns (
  district_name text not null references public.sri_lanka_districts(name) on update cascade on delete cascade,
  name text not null,
  primary key (district_name, name)
);

insert into public.sri_lanka_districts(name) values
  ('Ampara'), ('Anuradhapura'), ('Badulla'), ('Batticaloa'), ('Colombo'),
  ('Galle'), ('Gampaha'), ('Hambantota'), ('Jaffna'), ('Kalutara'),
  ('Kandy'), ('Kegalle'), ('Kilinochchi'), ('Kurunegala'), ('Mannar'),
  ('Matale'), ('Matara'), ('Moneragala'), ('Mullaitivu'), ('Nuwara Eliya'),
  ('Polonnaruwa'), ('Puttalam'), ('Ratnapura'), ('Trincomalee'), ('Vavuniya')
on conflict (name) do nothing;

insert into public.sri_lanka_towns(district_name, name) values
  ('Ampara', 'Akkaraipattu'), ('Ampara', 'Ampara'), ('Ampara', 'Kalmunai'), ('Ampara', 'Pottuvil'), ('Ampara', 'Sammanthurai'), ('Ampara', 'Uhana'),
  ('Anuradhapura', 'Anuradhapura'), ('Anuradhapura', 'Eppawala'), ('Anuradhapura', 'Kekirawa'), ('Anuradhapura', 'Medawachchiya'), ('Anuradhapura', 'Mihintale'), ('Anuradhapura', 'Nochchiyagama'),
  ('Badulla', 'Badulla'), ('Badulla', 'Bandarawela'), ('Badulla', 'Ella'), ('Badulla', 'Haputale'), ('Badulla', 'Mahiyanganaya'), ('Badulla', 'Passara'), ('Badulla', 'Welimada'),
  ('Batticaloa', 'Batticaloa'), ('Batticaloa', 'Eravur'), ('Batticaloa', 'Kattankudy'), ('Batticaloa', 'Valaichchenai'), ('Batticaloa', 'Vellaveli'),
  ('Colombo', 'Avissawella'), ('Colombo', 'Colombo'), ('Colombo', 'Dehiwala'), ('Colombo', 'Homagama'), ('Colombo', 'Kaduwela'), ('Colombo', 'Kotte'), ('Colombo', 'Maharagama'), ('Colombo', 'Moratuwa'), ('Colombo', 'Padukka'),
  ('Galle', 'Ambalangoda'), ('Galle', 'Baddegama'), ('Galle', 'Bentota'), ('Galle', 'Elpitiya'), ('Galle', 'Galle'), ('Galle', 'Hikkaduwa'),
  ('Gampaha', 'Gampaha'), ('Gampaha', 'Ja-Ela'), ('Gampaha', 'Katunayake'), ('Gampaha', 'Kelaniya'), ('Gampaha', 'Minuwangoda'), ('Gampaha', 'Negombo'), ('Gampaha', 'Wattala'),
  ('Hambantota', 'Ambalantota'), ('Hambantota', 'Beliatta'), ('Hambantota', 'Hambantota'), ('Hambantota', 'Tangalle'), ('Hambantota', 'Tissamaharama'), ('Hambantota', 'Weeraketiya'),
  ('Jaffna', 'Chavakachcheri'), ('Jaffna', 'Jaffna'), ('Jaffna', 'Nallur'), ('Jaffna', 'Point Pedro'), ('Jaffna', 'Valvettithurai'),
  ('Kalutara', 'Aluthgama'), ('Kalutara', 'Bandaragama'), ('Kalutara', 'Beruwala'), ('Kalutara', 'Horana'), ('Kalutara', 'Kalutara'), ('Kalutara', 'Matugama'), ('Kalutara', 'Panadura'),
  ('Kandy', 'Akurana'), ('Kandy', 'Gampola'), ('Kandy', 'Kandy'), ('Kandy', 'Katugastota'), ('Kandy', 'Nawalapitiya'), ('Kandy', 'Peradeniya'), ('Kandy', 'Wattegama'),
  ('Kegalle', 'Kegalle'), ('Kegalle', 'Mawanella'), ('Kegalle', 'Rambukkana'), ('Kegalle', 'Ruwanwella'), ('Kegalle', 'Warakapola'),
  ('Kilinochchi', 'Kilinochchi'), ('Kilinochchi', 'Pallai'), ('Kilinochchi', 'Paranthan'), ('Kilinochchi', 'Poonakary'),
  ('Kurunegala', 'Kuliyapitiya'), ('Kurunegala', 'Kurunegala'), ('Kurunegala', 'Narammala'), ('Kurunegala', 'Pannala'), ('Kurunegala', 'Polgahawela'), ('Kurunegala', 'Wariyapola'),
  ('Mannar', 'Mannar'), ('Mannar', 'Murunkan'), ('Mannar', 'Nanattan'), ('Mannar', 'Pesalai'),
  ('Matale', 'Dambulla'), ('Matale', 'Matale'), ('Matale', 'Rattota'), ('Matale', 'Sigiriya'), ('Matale', 'Ukuwela'),
  ('Matara', 'Akuressa'), ('Matara', 'Dikwella'), ('Matara', 'Hakmana'), ('Matara', 'Matara'), ('Matara', 'Weligama'),
  ('Moneragala', 'Bibile'), ('Moneragala', 'Buttala'), ('Moneragala', 'Kataragama'), ('Moneragala', 'Moneragala'), ('Moneragala', 'Wellawaya'),
  ('Mullaitivu', 'Mullaitivu'), ('Mullaitivu', 'Oddusuddan'), ('Mullaitivu', 'Puthukkudiyiruppu'), ('Mullaitivu', 'Thunukkai'),
  ('Nuwara Eliya', 'Ginigathhena'), ('Nuwara Eliya', 'Hatton'), ('Nuwara Eliya', 'Kotagala'), ('Nuwara Eliya', 'Nuwara Eliya'), ('Nuwara Eliya', 'Talawakele'),
  ('Polonnaruwa', 'Hingurakgoda'), ('Polonnaruwa', 'Medirigiriya'), ('Polonnaruwa', 'Polonnaruwa'),
  ('Puttalam', 'Anamaduwa'), ('Puttalam', 'Chilaw'), ('Puttalam', 'Kalpitiya'), ('Puttalam', 'Puttalam'), ('Puttalam', 'Wennappuwa'),
  ('Ratnapura', 'Balangoda'), ('Ratnapura', 'Embilipitiya'), ('Ratnapura', 'Pelmadulla'), ('Ratnapura', 'Ratnapura'),
  ('Trincomalee', 'Kantale'), ('Trincomalee', 'Kinniya'), ('Trincomalee', 'Muttur'), ('Trincomalee', 'Nilaveli'), ('Trincomalee', 'Trincomalee'),
  ('Vavuniya', 'Cheddikulam'), ('Vavuniya', 'Nedunkeni'), ('Vavuniya', 'Vavuniya')
on conflict (district_name, name) do nothing;

alter table public.sri_lanka_districts enable row level security;
alter table public.sri_lanka_towns enable row level security;

drop policy if exists "Anyone can read Sri Lankan districts" on public.sri_lanka_districts;
create policy "Anyone can read Sri Lankan districts"
  on public.sri_lanka_districts for select using (true);
drop policy if exists "Anyone can read Sri Lankan towns" on public.sri_lanka_towns;
create policy "Anyone can read Sri Lankan towns"
  on public.sri_lanka_towns for select using (true);
