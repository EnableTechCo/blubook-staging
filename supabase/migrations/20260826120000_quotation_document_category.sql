-- A document category for things only the client may read.
--
-- On its own this migration does nothing but add the value. Postgres refuses to
-- use a new enum label in the same transaction that created it, and each
-- migration file is one transaction — so the policies that key on it are in the
-- next file rather than this one.

alter type public.document_category add value if not exists 'quotation';
