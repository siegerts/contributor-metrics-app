import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";
import {
  Container,
  Box,
  Flex,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";

import { FiTrendingUp, FiMessageCircle } from "react-icons/fi";

const LinkItems = [
  { name: "Trending by repo", url: "/trending", icon: FiTrendingUp },
  { name: "Needs response", url: "/pending", icon: FiMessageCircle },
];

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Blindspots</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className>
        <Container my={7} maxW="container.lg">
          <Box
            transition="3s ease"
            bg={useColorModeValue("white", "gray.900")}
            w={{ base: "full", md: 60 }}
            pos="fixed"
            h="full"
          >
            <Flex
              h="20"
              alignItems="center"
              mx="8"
              justifyContent="space-between"
            >
              {/* <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
                Logo
              </Text> */}
            </Flex>
            {LinkItems.map((link) => (
              <NavItem key={link.name} icon={link.icon} url={link.url}>
                {link.name}
              </NavItem>
            ))}
          </Box>
        </Container>
      </main>
    </div>
  );
}

const NavItem = ({ icon, url, children, ...rest }) => {
  return (
    <Link href={url} style={{ textDecoration: "none" }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: "gray.400",
          color: "white",
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: "white",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};
