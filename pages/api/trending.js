import prisma from "../../lib/prisma";

export default async function handle(req, res) {
  const evts = await prisma.$queryRaw`
  SELECT * from
	(select
	issues.id,
	ROW_NUMBER() over (PARTITION BY issues.repo order by events.comments desc) as rownum,
	issues.repo,
	issues.title,
	issues.html_url,
	issues.user->>'avatar_url' as avatar,
	events.*
	from
    (
		select issue_id as id,
		count(*) as comments,
		sum((reactions->'+1')::int) as "+1",
		sum((reactions->'-1')::int) as "-1",
		sum((reactions->'eyes')::int) as eyes,
		sum((reactions->'heart')::int) as heart,
		sum((reactions->'laugh')::int) as laugh,
		sum((reactions->'hooray')::int) as hooray,
		sum((reactions->'rocket')::int) as rocket,
		sum((reactions->'confused')::int) as confused,
		sum((reactions->'total_count')::int) as total_count
		FROM public.events 
		where username not in (select login from public.members) and 
			  updated_at >= now() - INTERVAL'1 week'
		group by issue_id
	) as events
	inner join
	public.issues using (id)
	where issues.state='open'
	order by repo, comments desc) trends where trends.rownum <= 10;
  `;

  res.json(evts);
}
