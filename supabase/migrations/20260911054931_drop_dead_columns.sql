-- Three columns nothing ever wrote or read.
--
-- documents.issued_at was created with the documents table in July for the
-- date printed on the document itself. No form captured it, no page showed
-- it, and no function touched it. request_events.note and
-- request_schedules.note were created the same way, for a reason on a status
-- change or a reschedule; neither the triggers that write those tables nor
-- any action ever set them. On hosted staging all three are null on every
-- row, and a survey of the code found no reference to any of them outside
-- the generated types.
--
-- request_assignments.note is not among these: it is the partner's decline
-- reason, written by reject_assignment and shown to operations since #162.

alter table public.documents drop column issued_at;
alter table public.request_events drop column note;
alter table public.request_schedules drop column note;
