-- Seed the departments used by the bungalow contribution dropdown.
-- Safe to run more than once; existing names are left unchanged.
insert into public.departments (name)
select supplied.name
from (values
  ('Agrarian Development Department'),
  ('Attorney General''s Department'),
  ('Coast Conservation and Coastal Resource Management Department'),
  ('Coast Conservation Department'),
  ('Department of Archaeology'),
  ('Department of Ayurveda'),
  ('Department of Buildings'),
  ('Department of Buddhist Affairs'),
  ('Department of Census and Statistics'),
  ('Department of Christian Religious Affairs'),
  ('Department of Civil Security'),
  ('Department of Commerce'),
  ('Department of Cooperative Development'),
  ('Department of Cultural Affairs'),
  ('Department of Customs'),
  ('Department of Debt Conciliation Board'),
  ('Department of Development Finance'),
  ('Department of Educational Publications'),
  ('Department of Elections'),
  ('Department of Excise'),
  ('Department of Examinations'),
  ('Department of Export Agriculture'),
  ('Department of External Resources'),
  ('Department of Fisheries and Aquatic Resources'),
  ('Department of Forest Conservation'),
  ('Department of Government Analyst''s'),
  ('Department of Government Factory'),
  ('Department of Government Information'),
  ('Department of Government Printing'),
  ('Department of Health Services'),
  ('Department of Hindu Religious and Cultural Affairs'),
  ('Department of Immigration and Emigration'),
  ('Department of Import and Export Control'),
  ('Department of Inland Revenue'),
  ('Department of Industries, Western Province'),
  ('Department of Irrigation'),
  ('Department of Labour'),
  ('Department of Land Commissioner General''s'),
  ('Department of Land Settlement'),
  ('Department of Management Services'),
  ('Department of Meteorology'),
  ('Department of Motor Traffic'),
  ('Department of National Archives'),
  ('Department of National Budget'),
  ('Department of National Museum'),
  ('Department of National Physical Planning'),
  ('Department of Official Languages'),
  ('Department of Pensions'),
  ('Department of Police'),
  ('Department of Prisons'),
  ('Department of Probation & Child Care Services'),
  ('Department of Project Management and Monitoring'),
  ('Department of Public Finance'),
  ('Department of Public Trustee'),
  ('Department of Railways'),
  ('Department of Registrar of Companies'),
  ('Department of Registration of Persons'),
  ('Department of Rubber Development'),
  ('Department of Samurdhi'),
  ('Department of Social Services'),
  ('Department of Survey'),
  ('Department of Technical Education & Training'),
  ('Department of Textile Industry - University of Moratuwa'),
  ('Department of Valuation'),
  ('Department of Wildlife Conservation'),
  ('Department of the Commissioner General of Samurdhi'),
  ('Department of the Registrar of Companies'),
  ('Measurement Units, Standards & Services Department'),
  ('Ministry of Culture and the Arts'),
  ('Sri Lanka Police'),
  ('Sri Lanka Post'),
  ('Survey Department of Sri Lanka')
) as supplied(name)
where not exists (
  select 1
  from public.departments as existing
  where lower(trim(existing.name)) = lower(trim(supplied.name))
);

-- Let signed-in contributors add a missing department through the submission form.
alter table public.departments enable row level security;

drop policy if exists "Anyone can read departments" on public.departments;
create policy "Anyone can read departments"
  on public.departments for select using (true);

drop policy if exists "Authenticated users can add departments" on public.departments;
create policy "Authenticated users can add departments"
  on public.departments for insert to authenticated
  with check (char_length(trim(name)) between 2 and 120);
