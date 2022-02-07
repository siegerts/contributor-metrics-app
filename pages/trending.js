import useSWR, { SWRConfig } from "swr";
import prisma from "../lib/prisma";

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
  const trendingByRepo = await prisma.trendingOpen.findMany();

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
                    <Flex my="9">
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
                          <Text mr="1" fontSize="sm">
                            #{issue.number} •{" "}
                          </Text>
                          <Text mr="1" fontSize="sm">
                            {issue.r_comments} recent comment
                            {issue.r_comments > 1 ? "s" : ""} •{" "}
                          </Text>
                          <Text mr="1" fontSize="sm">
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
                            <Tag mx={2}>👍 {issue["p1"]}</Tag>
                            <Tag mr={2}>
                              👎
                              {issue["m1"]}
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
