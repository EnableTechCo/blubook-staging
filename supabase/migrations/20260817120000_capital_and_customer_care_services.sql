-- Services for the two work groups that had none.
--
-- Capital and Customer Care have existed as groups since the routing work but
-- carried no services, so nothing could ever be routed to either. Every other
-- active service already belongs to a group, and the only ungrouped ones are
-- the two inactive internal services, which stay where they are.
--
-- Both groups are still empty of partners. A service whose group has no members
-- has nowhere to be assigned, so these are seeded active but will sit in
-- awaiting_assignment until partners are added to the groups. That is the
-- honest state rather than a hidden one: the service exists and can be
-- requested, and the queue shows what is waiting on staffing.

insert into public.services (slug, name, description, active, group_id)
values
  (
    'funding-application',
    'Funding Application',
    'Preparing and submitting an application for external funding, including the supporting financial pack a lender asks for.',
    true,
    (select id from public.service_groups where slug = 'capital')
  ),
  (
    'asset-finance',
    'Asset Finance',
    'Arranging finance against equipment, vehicles or other assets, from quotation through to agreement.',
    true,
    (select id from public.service_groups where slug = 'capital')
  ),
  (
    'invoice-discounting',
    'Invoice Discounting',
    'Releasing cash held in unpaid invoices, including the reconciliation the facility requires.',
    true,
    (select id from public.service_groups where slug = 'capital')
  ),
  (
    'customer-support',
    'Customer Support',
    'Handling a customer request end to end, from first contact through to a resolution the customer accepts.',
    true,
    (select id from public.service_groups where slug = 'customer-care')
  ),
  (
    'complaints-handling',
    'Complaints Handling',
    'Investigating and resolving a complaint, with the record of what was decided and why.',
    true,
    (select id from public.service_groups where slug = 'customer-care')
  ),
  (
    'query-resolution',
    'Query Resolution',
    'Answering a customer question that needs looking into — an account, an invoice or an order — and closing the loop.',
    true,
    (select id from public.service_groups where slug = 'customer-care')
  )
on conflict (slug) do nothing;
