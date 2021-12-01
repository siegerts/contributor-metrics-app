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
	events.created_at as evt_created
FROM public.issues
cross join jsonb_array_elements(array_to_json(labels)::jsonb) as label
inner join 
(select issue_id as id, username, event, created_at from public.events where event='commented') events using (id)
where (label->>'name' LIKE 'pending%response%' or label->>'name' LIKE 'pending-close%') and 
	issues.state='open' and
	events.created_at >= issues.updated_at and 
	events.username not in (select login from public.members)
order by repo, issues.id;
  `;

  res.json(evts);
}
