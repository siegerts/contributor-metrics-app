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
		issues.username,
		issues.user->>'avatar_url' as avatar,
		issues.created_at,
		issues.updated_at,
		events.*,
		(events."+1" + (issues.reactions->'+1')::int) as "+1",
		(events."-1" + (issues.reactions->'-1')::int) as "-1",
		(events.eyes + (issues.reactions->'eyes')::int) as eyes,
		(events.heart + (issues.reactions->'heart')::int) as heart,
		(events.laugh + (issues.reactions->'laugh')::int) as laugh,
		(events.hooray + (issues.reactions->'hooray')::int) as hooray,
		(events.rocket + (issues.reactions->'rocket')::int) as rocket,
		(events.confused + (issues.reactions->'confused')::int) as confused,
		(events.total_count + (issues.reactions->'total_count')::int) as total_count
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
	order by repo, comments desc) trends 
	left outer join
	(
		SELECT username, repo, count(*) as user_bug_count
		FROM public.issues 
		cross join jsonb_array_elements(array_to_json(labels)::jsonb) as label
		where value->>'name'='bug'
		group by repo, "user", username
	) bug_count
	using (username, repo)
	where trends.rownum <= 10
	order by trends.repo, trends.comments desc, updated_at;
  `;

  res.json(evts);
}
