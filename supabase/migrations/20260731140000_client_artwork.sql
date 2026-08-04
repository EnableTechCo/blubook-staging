-- Client artwork
--
-- Artwork is the client's profile picture — their logo or mark. It identifies
-- the account rather than documenting anything, so it is a property of the
-- client record and not a row in documents: one current image, replaced rather
-- than versioned, and never filed into a folder.
--
-- It lives in its own public bucket. The documents bucket is private because
-- every download is mediated server-side after an RLS check, but a profile
-- picture is rendered by the browser in an <img> tag, which cannot carry that
-- check. A logo is not sensitive, so a public object avoids minting a signed
-- URL on every page render.

alter table public.clients
  add column artwork_path text;

comment on column public.clients.artwork_path is
  'Storage object path in the public artwork bucket; the client profile picture.';

insert into storage.buckets (id, name, public)
values ('artwork', 'artwork', true)
on conflict (id) do nothing;

-- No storage.objects policies: uploads and replacements run through the service
-- role in staff-authorised server code, matching the documents bucket. Reads
-- need no policy because the bucket is public.
