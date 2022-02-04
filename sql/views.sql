-- trending
CREATE or REPLACE VIEW trending_open as
    SELECT trends.id,
        trends.number,
        trends.rank,
        trends.repo,
        trends.title,
        trends.html_url,
        trends.assignee,
        trends.assignees,
        trends.labels,
        trends.username,
        trends.avatar,
        trends.created_at,
        trends.updated_at,
        trends.r_comments,
        trends."r_+1",
        trends."r_-1",
        trends.r_eyes,
        trends.r_heart,
        trends.r_laugh,
        trends.r_hooray,
        trends.r_rocket,
        trends.r_confused,
        trends.r_tc,
        trends."+1",
        trends."-1",
        trends.eyes,
        trends.heart,
        trends.laugh,
        trends.hooray,
        trends.rocket,
        trends.confused,
        trends.tc
    FROM ( SELECT issues.id,
                issues.number,
                row_number() OVER (PARTITION BY r_events.repo ORDER BY r_events.comments DESC, issues.updated_at) AS rank,
		  		r_events.repo,
                issues.title,
                issues.html_url,
                issues.assignee,
                issues.assignees,
                issues.labels,
                issues.username,
                issues."user" ->> 'avatar_url'::text AS avatar,
                issues.created_at,
                issues.updated_at,
                r_events.comments AS r_comments,
                r_events."r_+1",
                r_events."r_-1",
                r_events.r_eyes,
                r_events.r_heart,
                r_events.r_laugh,
                r_events.r_hooray,
                r_events.r_rocket,
                r_events.r_confused,
                r_events.r_tc,
                r_events."r_+1" + (issues.reactions -> '+1'::text)::integer AS "+1",
                r_events."r_-1" + (issues.reactions -> '-1'::text)::integer AS "-1",
                r_events.r_eyes + (issues.reactions -> 'eyes'::text)::integer AS eyes,
                r_events.r_heart + (issues.reactions -> 'heart'::text)::integer AS heart,
                r_events.r_laugh + (issues.reactions -> 'laugh'::text)::integer AS laugh,
                r_events.r_hooray + (issues.reactions -> 'hooray'::text)::integer AS hooray,
                r_events.r_rocket + (issues.reactions -> 'rocket'::text)::integer AS rocket,
                r_events.r_confused + (issues.reactions -> 'confused'::text)::integer AS confused,
                (issues.reactions -> 'total_count'::text)::integer AS tc
            FROM ( SELECT 
				  		events.issue_id,
				  		events.repo,
                        count(*) AS comments,
                        sum((events.reactions -> '+1'::text)::integer) AS "r_+1",
                        sum((events.reactions -> '-1'::text)::integer) AS "r_-1",
                        sum((events.reactions -> 'eyes'::text)::integer) AS r_eyes,
                        sum((events.reactions -> 'heart'::text)::integer) AS r_heart,
                        sum((events.reactions -> 'laugh'::text)::integer) AS r_laugh,
                        sum((events.reactions -> 'hooray'::text)::integer) AS r_hooray,
                        sum((events.reactions -> 'rocket'::text)::integer) AS r_rocket,
                        sum((events.reactions -> 'confused'::text)::integer) AS r_confused,
                        sum((events.reactions -> 'total_count'::text)::integer) AS r_tc
                    FROM events
                    WHERE NOT (events.username::text IN ( SELECT members.login
                            FROM members)) AND events.username::text !~~ '%github-actions[bot]%'::text AND events.updated_at >= (now() - '7 days'::interval)
                    GROUP BY events.repo, events.issue_id) r_events
                JOIN issues ON r_events.issue_id = issues.id
            WHERE issues.state::text = 'open'::text 
            ORDER BY issues.repo, r_events.comments DESC
		 ) trends
    WHERE trends.rank <= 10
	ORDER BY trends.repo, trends.r_comments DESC, trends.updated_at;


SELECT issues.number,
    issues.repo,
    issues.title,
    issues.html_url,
    issues.assignee,
    issues.assignees,
    issues.username,
    issues."user" ->> 'avatar_url'::text AS avatar,
    issues.created_at,
    issues.updated_at,
    trends.id,
    trends.comments,
    trends."r_+1",
    trends."r_-1",
    trends.r_eyes,
    trends.r_heart,
    trends.r_laugh,
    trends.r_hooray,
    trends.r_rocket,
    trends.r_confused,
    trends.r_tc
   FROM ( SELECT _e.issue_id AS id,
            count(*) AS comments,
            sum((_e.reactions -> '+1'::text)::integer) AS "r_+1",
            sum((_e.reactions -> '-1'::text)::integer) AS "r_-1",
            sum((_e.reactions -> 'eyes'::text)::integer) AS r_eyes,
            sum((_e.reactions -> 'heart'::text)::integer) AS r_heart,
            sum((_e.reactions -> 'laugh'::text)::integer) AS r_laugh,
            sum((_e.reactions -> 'hooray'::text)::integer) AS r_hooray,
            sum((_e.reactions -> 'rocket'::text)::integer) AS r_rocket,
            sum((_e.reactions -> 'confused'::text)::integer) AS r_confused,
            sum((_e.reactions -> 'total_count'::text)::integer) AS r_tc
           FROM ( SELECT events.id,
                    events.issue_id,
                    events.org,
                    events.repo,
                    events.event,
                    events.body,
                    events.label,
                    events.reactions,
                    events.created_at,
                    events.node_id,
                    events."user",
                    events.username,
                    events.updated_at,
                    events.author_association
                   FROM events
                  WHERE NOT (events.username::text IN ( SELECT members.login
                           FROM members)) AND events.username::text !~~ '%github-actions[bot]%'::text AND events.updated_at >= (now() - '14 days'::interval)) _e
             JOIN issues issues_1 ON _e.issue_id = issues_1.id AND issues_1.state::text = 'closed'::text AND _e.created_at > issues_1.closed_at
          GROUP BY _e.issue_id) trends
     JOIN issues USING (id)
  ORDER BY issues.repo, trends.comments DESC, issues.updated_at;


-- needs response
CREATE or REPLACE VIEW pending as
    SELECT DISTINCT 
        issues.repo,
        COALESCE(
            CASE
                WHEN split_part(issues.repo::text, '-'::text, 2) <> ''::text THEN split_part(issues.repo::text, '-'::text, 2)
                ELSE NULL::text
            END, issues.repo::text) AS repo_display,
        issues.title,
        issues.id,
        issues.number,
        issues.html_url,
        issues.assignee,
        issues.username,
        issues.comments,
        issues."user" ->> 'avatar_url'::text AS avatar,
        issues.created_at,
        issues.updated_at,
        issues.state,
        events.updated_at AS evt_updated_at,
        events.max_date
    FROM issues
        CROSS JOIN LATERAL jsonb_array_elements(array_to_json(issues.labels)::jsonb) label(value)
        JOIN ( SELECT events_1.issue_id AS id,
                events_1.username,
                events_1.updated_at,
                max(events_1.updated_at) OVER (PARTITION BY events_1.issue_id) AS max_date
            FROM events events_1
            WHERE events_1.event::text = 'commented'::text) events USING (id)
    WHERE ((label.value ->> 'name'::text) ~~ 'pending%response%'::text OR (label.value ->> 'name'::text) ~~ 'pending-close%'::text) AND issues.state::text = 'open'::text AND events.updated_at = events.max_date AND NOT (events.username::text IN ( SELECT members.login
            FROM members))
    ORDER BY issues.repo, issues.updated_at DESC;