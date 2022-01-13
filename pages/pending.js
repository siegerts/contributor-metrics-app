import useSWR, { SWRConfig } from "swr";
import prisma from "../lib/prisma";

import {
  Container,
  Code,
  Heading,
  Flex,
  Box,
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  AvatarBadge,
  Badge,
  Text,
  Link,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tooltip,
  useToast,
} from "@chakra-ui/react";

import { formatDistance, parseJSON } from "date-fns";
import { FiMessageCircle } from "react-icons/fi";
import { ExternalLinkIcon } from "@chakra-ui/icons";

const fetcher = (url) => fetch(url).then((res) => res.json());

export async function getServerSideProps({ req }) {
  const needsResponseByRepo = await prisma.$queryRaw`
  SELECT distinct
	issues.repo,
	issues.title,
	issues.id,
	issues.html_url,
  issues.username,
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
order by repo, issues.updated_at desc;
  `;

  return {
    props: {
      fallback: {
        "/api/pending": needsResponseByRepo,
      },
    },
  };
}

function NeedsResponse() {
  const toast = useToast();
  const { data: issues, error } = useSWR("/api/pending", fetcher, {
    refreshInterval: 1000 * 60 * 5,
    onSuccess: () => {
      toast({
        title: "Data refreshed",
        position: "bottom-right",
        isClosable: true,
      });
    },
  });

  if (error) return <div>failed to load</div>;
  if (Array.isArray(issues) && !issues.length)
    return (
      <Text color="gray.500">
        This looks empty for now. Check back later 🚀
      </Text>
    );

  const repos = [...new Set(issues.map((issue) => issue.repo))];

  return (
    <div>
      <Tabs size={"md"} variant="soft-rounded" colorScheme="green">
        <TabList>
          {repos.map((repo) => (
            <Tab key={repo}>
              <Text fontWeight="bold" px={3}>
                {" "}
                {repo.split("-")[1]}
              </Text>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {repos.map((repo) => (
            <TabPanel key={repo}>
              {issues
                .filter((issue) => issue.repo == repo)
                .map((issue) => (
                  <div key={issue.id}>
                    <Flex my="4">
                      <Tooltip label={`opened by ${issue.username}`}>
                        <Avatar src={issue.avatar}></Avatar>
                      </Tooltip>
                      <Box ml="3">
                        <Text fontWeight="bold">
                          <Badge mx="1" variant="outline" colorScheme="green">
                            {issue.repo.split("-")[1]}
                          </Badge>
                          <Link href={issue.html_url} isExternal>
                            {issue.title} <ExternalLinkIcon mx="1px" />
                          </Link>
                        </Text>
                        <Text mx="1" fontSize="sm">
                          last updated{" "}
                          {formatDistance(
                            parseJSON(issue.updated_at),
                            new Date(),
                            {
                              addSuffix: true,
                            }
                          )}
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
    <Container maxW="container.lg" my={5}>
      <Breadcrumb fontWeight="medium" fontSize="sm">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Pending</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Heading my="6">
        <Flex alignItems={"center"}>
          <FiMessageCircle /> <Box ml={3}>Needs response</Box>
        </Flex>
      </Heading>
      <Text fontSize="s" my="5">
        <Code>pending-response</Code> label is present and the customer has
        responded.
      </Text>
      <SWRConfig value={{ fallback }}>
        <NeedsResponse />
      </SWRConfig>
    </Container>
  );
}
