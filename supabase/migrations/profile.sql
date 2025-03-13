-- Create profile table for role management
create table profiles (
  user_id uuid references auth.users not null primary key,
  role text not null default 'user' check (role in ('user', 'admin', 'worker', 'dealer', 'salesman')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security for profiles
alter table profiles enable row level security;

-- Create policies for profile management
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = user_id );

create policy "Users can insert own profile"
  on profiles for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = user_id );

-- Create trigger for profiles updated_at
create extension if not exists moddatetime;

create trigger handle_profiles_updated_at before update on profiles
  for each row execute procedure moddatetime (updated_at);

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Drop the trigger if it already exists to avoid the "already exists" error
drop trigger if exists on_auth_user_created on auth.users;

-- Trigger to call handle_new_user on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
