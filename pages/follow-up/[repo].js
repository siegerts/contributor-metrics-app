import { useEffect, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import prisma from "../../lib/prisma";

import { Divider } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";

import {
  Container,
  Heading,
  Flex,
  Box,
  Link,
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  Tag,
  TagLabel,
  Tooltip,
  useToast,
} from "@chakra-ui/react";

import { formatDistance, differenceInBusinessDays, parseJSON } from "date-fns";

import { FiMessageCircle } from "react-icons/fi";
import { ExternalLinkIcon } from "@chakra-ui/icons";

const fetcher = (url) => fetch(url).then((res) => res.json());

export async function getServerSideProps(context) {
  const repo = context.params.repo;

  const needsAction = await prisma.sla.findMany({
    where: {
      repo: repo,
    },
  });

  return {
    props: {
      repo,
      fallback: {
        [`/api/follow-up/${repo}`]: needsAction,
      },
    },
  };
}

function StateNav({ repo }) {
  const router = useRouter();
  return (
    <Box my={6}>
      {/* <NextLink href={`/trending/${repo}`} passhref>
        <Link
          fontSize={"sm"}
          rounded={"md"}
          px={3}
          py={2}
          ml={"-12px!important"}
          mr={3}
          bg={router.asPath === `/trending/${repo}` ? "green.50" : undefined}
          fontWeight={router.asPath === `/trending/${repo}` ? 600 : 400}
          color={
            router.asPath === `/trending/${repo}` ? "green.700" : "gray.700"
          }
          _hover={{
            bg: router.asPath === `/trending/${repo}` ? "green.50" : "gray.100",
          }}
        >
          Open
        </Link>
      </NextLink>

      <NextLink href={`/trending/${repo}/closed`} passhref>
        <Link
          fontSize={"sm"}
          rounded={"md"}
          px={3}
          py={2}
          ml={"-12px!important"}
          mr={3}
          bg={
            router.asPath === `/trending/${repo}/closed` ? "purple" : undefined
          }
          fontWeight={router.asPath === `/trending/${repo}/closed` ? 600 : 400}
          color={
            router.asPath === `/trending/${repo}/closed` ? "purple" : "gray.700"
          }
          _hover={{
            bg:
              router.asPath === `/trending/${repo}/closed`
                ? "purple"
                : "gray.100",
          }}
        >
          Closed
        </Link>
      </NextLink> */}
    </Box>
  );
}

function Trending({ repo }) {
  const toast = useToast();

  const { data: issues, error } = useSWR(`/api/follow-up/${repo}`, fetcher, {
    refreshInterval: 1000 * 5 * 60,
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
      <>
        {/* <StateNav repo={repo} /> */}
        <Text color="gray.500">
          This looks empty for now. Check back later!
        </Text>
      </>
    );

  return (
    <Box my={6}>
      {/* <NextLink href={`/trending/${repo}`} passhref>
        <Link
          fontSize={"sm"}
          rounded={"md"}
          px={3}
          py={2}
          ml={"-12px!important"}
          mr={3}
          bg={router.asPath === `/trending/${repo}` ? "green.50" : undefined}
          fontWeight={router.asPath === `/trending/${repo}` ? 600 : 400}
          color={
            router.asPath === `/trending/${repo}` ? "green.700" : "gray.700"
          }
          _hover={{
            bg: router.asPath === `/trending/${repo}` ? "green.50" : "gray.100",
          }}
        >
          Open
        </Link>
      </NextLink>

      <NextLink href={`/trending/${repo}/closed`} passhref>
        <Link
          fontSize={"sm"}
          rounded={"md"}
          px={3}
          py={2}
          ml={"-12px!important"}
          mr={3}
          bg={
            router.asPath === `/trending/${repo}/closed`
              ? "purple.50"
              : undefined
          }
          fontWeight={router.asPath === `/trending/${repo}/closed` ? 600 : 400}
          color={
            router.asPath === `/trending/${repo}/closed`
              ? "purple.700"
              : "gray.700"
          }
          _hover={{
            bg:
              router.asPath === `/trending/${repo}/closed`
                ? "purple.50"
                : "gray.100",
          }}
        >
          Closed
        </Link>
      </NextLink> */}

      <Box w="100%" key={repo}>
        <Flex justify={"end"}>
          <Text fontSize="xs" color="gray.700" mr={4}>
            Assignee
          </Text>
        </Flex>
        <Divider />
        {issues.map((issue) => (
          <Box w="100%" key={issue.id}>
            <Flex my="9">
              <Tooltip label={`opened by ${issue.username}`}>
                <Avatar src={issue.avatar}></Avatar>
              </Tooltip>
              <Box ml="3" w="100%">
                <Text fontWeight="bold">
                  <NextLink href={issue.html_url} passHref>
                    <Link isExternal>
                      {issue.title} <ExternalLinkIcon mx="1px" mb={1} />
                    </Link>
                  </NextLink>
                </Text>

                <Flex wrap my={2} alignItems={"center"} justify={"between"}>
                  <Flex wrap w="100%" alignItems={"center"}>
                    <Tag
                      size={"md"}
                      key={issue.number}
                      variant="outline"
                      colorScheme="blue"
                    >
                      <Tooltip label={issue.created_at}>
                        <TagLabel>
                          created{" "}
                          {formatDistance(
                            parseJSON(issue.created_at),
                            new Date(),
                            {
                              addSuffix: true,
                            }
                          )}{" "}
                          (
                          {differenceInBusinessDays(
                            new Date(),
                            parseJSON(issue.created_at)
                          ) - 2}{" "}
                          days past)
                        </TagLabel>
                      </Tooltip>
                    </Tag>
                    <Text mx="2" fontSize="sm">
                      #{issue.number} • {issue.comments} comment
                      {issue.comments == 1 ? "" : "s"} • updated{" "}
                      {formatDistance(parseJSON(issue.updated_at), new Date(), {
                        addSuffix: true,
                      })}
                    </Text>
                  </Flex>
                  {!issue.assignee && (
                    <Box>
                      <Tag size="lg" colorScheme="yellow" borderRadius="full">
                        <TagLabel>Unassigned</TagLabel>
                      </Tag>
                    </Box>
                  )}

                  {issue.assignee && (
                    <Box>
                      <Tag size="lg" colorScheme="gray" borderRadius="full">
                        <Avatar
                          src={issue.assignee?.avatar_url}
                          size="xs"
                          name={issue.assignee?.avatar_url}
                          ml={-1}
                          mr={2}
                        />
                        <TagLabel>{issue.assignee?.login}</TagLabel>
                      </Tag>
                    </Box>
                  )}
                </Flex>
                <Flex w="100%" alignItems={"center"} justify={"between"}>
                  <Box>
                    <span>
                      {" "}
                      {issue?.labels.map((label) => (
                        <Tag
                          size="sm"
                          ml={1}
                          mr={1}
                          key={issue.id}
                          borderRadius="full"
                          variant="solid"
                          colorScheme="gray"
                        >
                          <TagLabel>{label.name}</TagLabel>
                        </Tag>
                      ))}
                    </span>
                  </Box>
                  {/* <Box my={2} display={"block"}>
                    <Tag mr={2}>👍 {issue["p1"]}</Tag>
                    <Tag mr={2}>
                      👎
                      {issue["m1"]}
                    </Tag>
                    <Tag mr={2}>👀 {issue.eyes}</Tag>
                    <Tag mr={2}>❤️ {issue["heart"]}</Tag>
                  </Box> */}
                </Flex>
              </Box>
            </Flex>

            <Divider />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function Page({ repo, fallback }) {
  return (
    <Container maxW="container.lg" my={8}>
      <Breadcrumb fontWeight="medium" fontSize="sm">
        <BreadcrumbItem>
          <BreadcrumbLink href={`/trending`}>Follow ups</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href={`/trending/${repo}`}>{repo}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Heading my="6">
        <Flex alignItems={"center"}>
          <FiMessageCircle /> <Box ml={3}>Follow up in {repo}</Box>
        </Flex>
      </Heading>

      <Text fontSize="s" my="5">
        {/* These ... */}
      </Text>

      <SWRConfig value={{ fallback }}>
        <Trending repo={repo} />
      </SWRConfig>
    </Container>
  );
}
