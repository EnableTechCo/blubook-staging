-- Products on a quotation are sold in whole units. Keep the numeric column so
-- existing quotations remain untouched, but reject fractional quantities from
-- this point forward.
alter table public.quotation_items
  add constraint quotation_items_quantity_whole_number
  check (quantity = trunc(quantity)) not valid;
