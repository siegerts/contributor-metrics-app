import useSWR, { SWRConfig } from "swr";
import prisma from "../lib/prisma";
import { useEffect, useState } from "react";

import {
  Container,
  Heading,
  Flex,
  Box,
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Badge,
  Text,
  Tag,
  Link,
  Select,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tooltip,
  useToast,
} from "@chakra-ui/react";

import { formatDistance, parseJSON } from "date-fns";

import { FiTrendingUp } from "react-icons/fi";
import { ExternalLinkIcon } from "@chakra-ui/icons";

const fetcher = (url) => fetch(url).then((res) => res.json());

export async function getServerSideProps({ req }) {
  const trendingByRepo = await prisma.$queryRaw`
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
        "/api/trending": trendingByRepo,
      },
    },
  };
}

function Trending() {
  const toast = useToast();
  const { data: issues, error } = useSWR(`/api/trending`, fetcher, {
    refreshInterval: 1000 * 5 * 60,
    onSuccess: () => {
      toast({
        title: "Data refreshed",
        position: "bottom-right",
        isClosable: true,
      });
    },
  });

  const repos = [...new Set(issues.map((issue) => issue.repo))];

  if (error) return <div>failed to load</div>;
  if (Array.isArray(issues) && !issues.length)
    return (
      <Text color="gray.500">This looks empty for now. Check back later!</Text>
    );

  return (
    <div>
      <Tabs size={"md"} variant="soft-rounded" colorScheme="green">
        <TabList>
          {repos.map((repo) => (
            <Tab key={repo}>
              <Text fontWeight="bold" px={3} fontSize="s">
                {repo.split("-")[1]}
              </Text>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {repos.map((repo) => (
            <TabPanel w="100%" key={repo}>
              {issues
                .filter((issue) => issue.repo == repo)
                .map((issue) => (
                  <div w="100%" key={issue.id}>
                    <Flex my="5">
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
                        <Flex justify={"between"}>
                          <Text mx="1" fontSize="sm">
                            {issue.comments} recent comment
                            {issue.comments > 1 ? "s" : ""} •{" "}
                          </Text>
                          <Text mx="1" fontSize="sm">
                            updated{" "}
                            {formatDistance(
                              parseJSON(issue.updated_at),
                              new Date(),
                              {
                                addSuffix: true,
                              }
                            )}
                          </Text>
                          <Box>
                            <Tag mx={2}>👍 {issue["+1"]}</Tag>
                            <Tag mr={2}>
                              👎
                              {issue["-1"]}
                            </Tag>
                            <Tag mr={2}>👀 {issue.eyes}</Tag>
                            <Tag mr={2}>❤️ {issue["heart"]}</Tag>
                          </Box>
                        </Flex>
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
  return (
    <Container maxW="container.lg" my={5}>
      <Breadcrumb fontWeight="medium" fontSize="sm">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Trending</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Heading my="6">
        <Flex alignItems={"center"}>
          <FiTrendingUp /> <Box ml={3}>Trending</Box>
        </Flex>
      </Heading>
      {/* <Box maxW="sm">
        <Select
          onChange={(e) => handleIntervalChange(e)}
          variant="filled"
          placeholder="Select option"
        >
          <option key="1" value="1">
            1 week
          </option>
          <option key="2" value="2">
            2 weeks
          </option>
          <option key="4" value="4">
            4 weeks
          </option>
        </Select>
      </Box> */}
      <Text fontSize="s" my="5">
        Most active open issues during the last week (7 days). All activity is
        based on contributors.
      </Text>

      <SWRConfig value={{ fallback }}>
        <Trending />
      </SWRConfig>
    </Container>
  );
}
