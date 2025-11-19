'use client';
/* eslint-disable */

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Flex,
  HStack,
  Text,
  List,
  Icon,
  ListItem,
  useColorModeValue,
  Link,
  Divider,
} from '@chakra-ui/react';
import { FaCircle } from 'react-icons/fa';
import NavLink from '@/components/link/NavLink';
import { IRoute } from '@/types/navigation';
import { PropsWithChildren, useCallback, Fragment } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarLinksProps extends PropsWithChildren {
  routes: IRoute[];
}

export function SidebarLinks(props: SidebarLinksProps) {
  const pathname = usePathname();
  const activeColor = useColorModeValue('white', 'white');
  const inactiveColor = useColorModeValue('gray.400', 'gray.400');
  const activeIcon = useColorModeValue('brand.500', 'white');

  const { routes } = props;

  const activeRoute = useCallback(
    (routeName: string) => pathname?.includes(routeName),
    [pathname],
  );

  const createLinks = (routes: IRoute[]) =>
    routes.map((route, key) => {
      // --- Collapsible sections (User Access, Management)
      if (route.collapse && !route.invisible) {
        return (
          <Fragment key={key}>
            <Accordion defaultIndex={0} allowToggle>
              <AccordionItem border="none" mb={{ base: '4px', md: '6px' }}>
                <AccordionButton
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  px={{ base: '12px', md: '14px' }}
                  py={{ base: '10px', md: '12px' }}
                  borderRadius="md"
                  _hover={{ bg: 'whiteAlpha.100' }}
                >
                  {/* Left side: icon + label */}
                  <Flex align="center">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      me={{ base: '8px', md: '10px' }}
                      color={
                        activeRoute(route.path.toLowerCase())
                          ? activeIcon
                          : inactiveColor
                      }
                    >
                      {route.icon}
                    </Box>
                    <Text
                      color={
                        activeRoute(route.path.toLowerCase())
                          ? activeColor
                          : 'gray.200'
                      }
                      fontWeight="600"
                      fontSize={{ base: 'sm', md: 'sm' }}
                    >
                      {route.name}
                    </Text>
                  </Flex>

                  {/* Right side: PRO + arrow */}
                  <Flex align="center" gap="6px">
                    {/* <Link isExternal href="https://striv11.github.io/">
                      <Badge
                        fontSize="10px"
                        py="2px"
                        px="6px"
                        borderRadius="full"
                        colorScheme="purple"
                        variant="subtle"
                      >
                        PRO
                      </Badge>
                    </Link> */}
                    <AccordionIcon />
                  </Flex>
                </AccordionButton>

                {/* Sub-links */}
                <AccordionPanel py="0px" ps="0px">
                  <List>
                    {route.items &&
                      route.items.map((item, subKey) => (
                        <ListItem key={subKey}>
                          <Flex
                            align="center"
                            justifyContent="flex-start"
                            pl={{ base: '36px', md: '40px' }}
                            py={{ base: '8px', md: '10px' }}
                            _hover={{ bg: 'whiteAlpha.100', borderRadius: 'md' }}
                          >
                            <Icon
                              w={{ base: '4px', md: '5px' }}
                              h={{ base: '4px', md: '5px' }}
                              me={{ base: '6px', md: '8px' }}
                              as={FaCircle}
                              color={
                                activeRoute(item.path.toLowerCase())
                                  ? activeIcon
                                  : 'gray.400'
                              }
                            />
                            <Text
                              color={
                                activeRoute(item.path.toLowerCase())
                                  ? activeColor
                                  : 'gray.300'
                              }
                              fontSize={{ base: 'xs', md: 'xs' }}
                            >
                              {item.name}
                            </Text>
                          </Flex>
                        </ListItem>
                      ))}
                  </List>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            {/* Divider after User Access only */}
            {route.name === 'User Access' && (
              <Divider my={{ base: '10px', md: '12px' }} mx="12px" borderColor="whiteAlpha.200" />
            )}
          </Fragment>
        );
      }

      // --- Normal top-level links (Visa Applications, Profile Settings, etc.)
      if (!route.invisible) {
        return (
          <Flex
            key={key}
            align="center"
            justifyContent="space-between"
            px={{ base: '12px', md: '14px' }}
            py={{ base: '10px', md: '12px' }}
            mb={{ base: '4px', md: '6px' }}
            borderRadius="md"
            _hover={{ bg: route.disabled ? 'transparent' : 'whiteAlpha.100' }}
            opacity={route.disabled ? 0.5 : 1}
            cursor={route.disabled ? 'not-allowed' : 'pointer'}
            position="relative"
            role="group"
          >
            {/* Icon + label */}
            <Flex align="center">
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                me={{ base: '8px', md: '10px' }}
                color={
                  route.disabled 
                    ? 'gray.500'
                    : activeRoute(route.path.toLowerCase())
                    ? activeIcon
                    : inactiveColor
                }
              >
                {route.icon}
              </Box>
              <Text
                color={
                  route.disabled
                    ? 'gray.500'
                    : activeRoute(route.path.toLowerCase())
                    ? activeColor
                    : 'gray.200'
                }
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'sm' }}
              >
                {route.name}
              </Text>
            </Flex>

            {/* PRO badge for disabled items */}
            {route.disabled && (
              <Badge
                fontSize="10px"
                py="2px"
                px="6px"
                borderRadius="full"
                colorScheme="purple"
                variant="solid"
                bg="purple.500"
                color="white"
              >
                PRO
              </Badge>
            )}

            {/* Tooltip on hover for locked items */}
            {route.disabled && (
              <Box
                position="absolute"
                top="50%"
                left="110%"
                transform="translateY(-50%)"
                bg="purple.600"
                color="white"
                px="12px"
                py="6px"
                borderRadius="md"
                fontSize="xs"
                whiteSpace="nowrap"
                opacity="0"
                pointerEvents="none"
                transition="opacity 0.2s"
                _groupHover={{ opacity: 1 }}
                zIndex="tooltip"
                boxShadow="lg"
              >
                Upgrade to Pro to unlock
              </Box>
            )}
          </Flex>
        );
      }

      return null;
    });

  return <>{createLinks(routes)}</>;
}

export default SidebarLinks;
