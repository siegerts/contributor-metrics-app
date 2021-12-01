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

  return {
    props: {
      fallback: {
        "/api/pending": evts,
      },
    },
  };
}

function Trending() {
  const { data: evts, error } = useSWR("/api/pending", fetcher, {
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
                    {/* <pre>{issue.state}</pre> */}

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
                        <Text mx="1" fontSize="s"></Text>
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
      <Heading my="5">Needs response</Heading>
      <Text fontSize="s" my="5"></Text>

      <SWRConfig value={{ fallback }}>
        <Trending />
      </SWRConfig>
    </Container>
  );
}
