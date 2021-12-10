import prisma from "../../lib/prisma";

export default async function handle(req, res) {
  const evts = await prisma.$queryRaw`
  SELECT distinct
  issues.repo,
  issues.title,
  issues.id,
  issues.html_url,
  issues.comments,
  issues.user->>'avatar_url' as avatar,
  issues.created_at,
  issues.updated_at,
  issues.state,
  events.updated_at as evt_updated_at,
  events.max_date
FROM public.issues
cross join jsonb_array_elements(array_to_json(labels)::jsonb) as label
inner join 
  (select 
	   issue_id as id,
	   username,
	   updated_at,
	   max(updated_at) over (PARTITION BY issue_id) as max_date
   from public.events 
   where event='commented'
  ) events 
using (id)
where (label->>'name' LIKE 'pending%response%' or label->>'name' LIKE 'pending-close%') 
  and issues.state='open'
  and events.updated_at = events.max_date
  and events.username not in (select login from public.members)
order by repo, issues.id;
  `;

  res.json(evts);
}
