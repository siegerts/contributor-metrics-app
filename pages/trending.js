import useSWR, { SWRConfig } from "swr";
import prisma from "../lib/prisma";

import {
  Container,
  Heading,
  Flex,
  Box,
  Avatar,
  AvatarBadge,
  Badge,
  Text,
  Link,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
} from "@chakra-ui/react";

import { ExternalLinkIcon } from "@chakra-ui/icons";

const fetcher = (url) => fetch(url).then((res) => res.json());

export async function getServerSideProps({ req }) {
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

  return {
    props: {
      fallback: {
        "/api/trending": evts,
      },
    },
  };
}

function Trending() {
  const { data: evts, error } = useSWR("/api/trending", fetcher, {
    refreshInterval: 1000 * 60 * 5,
  });
  const repos = [...new Set(evts.map((issue) => issue.repo))];
  return (
    <div>
      <Tabs>
        <TabList>
          {repos.map((repo) => (
            <Tab key={repo}>
              <Text fontWeight="bold">{repo}</Text>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {repos.map((repo) => (
            <TabPanel key={repo}>
              {evts
                .filter((issue) => issue.repo == repo)
                .map((issue) => (
                  <div key={issue.id}>
                    <pre>{issue.state}</pre>

                    <Flex m="4">
                      <Avatar src={issue.avatar}>
                        {/* {issue.user_bug_count && (
                          <AvatarBadge
                            borderColor="papayawhip"
                            bg="tomato"
                            boxSize="1.25em"
                          />
                        )} */}
                      </Avatar>
                      <Box ml="3">
                        <Text fontWeight="bold">
                          <Badge mx="1" colorScheme="green">
                            {issue.repo}
                          </Badge>
                          <Link href={issue.html_url} isExternal>
                            {issue.title} <ExternalLinkIcon mx="1px" />
                          </Link>
                        </Text>
                        <Text mx="1" fontSize="s">
                          {/* total/recent */}
                          {issue.comments} recent comments | 👍 {issue["+1"]} |
                          👎
                          {issue["-1"]}| 👀 {issue.eyes} | ❤️ {issue["heart"]}
                        </Text>
                      </Box>
                    </Flex>
                  </div>
                ))}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </div>
  );
}

export default function Page({ fallback }) {
  // if (error) return <div>Failed to load</div>;
  // if (!data) return <div>Loading...</div>;

  return (
    <Container maxW="container.lg">
      <Heading my="5">Trending</Heading>
      <Text fontSize="s" my="5">
        Most active issues during the last week. All activity is based on
        contributors.
      </Text>

      <SWRConfig value={{ fallback }}>
        <Trending />
      </SWRConfig>
    </Container>
  );
}
