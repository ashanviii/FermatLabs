'use client';
// Chakra Imports
import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchBar } from './searchBar/SearchBar';
import { SidebarResponsive } from '../sidebar/Sidebar';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import APIModal from '../apiModal';
import NavLink from '../link/NavLink';
import routes from '../../routes';
import { useAuth } from '../../contexts/AuthContext';

export default function HeaderLinks(props: {
  secondary: boolean;
  setApiKey: any;
}) {
  const { secondary, setApiKey } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logOut } = useAuth();

  // Chakra Color Mode
  const navbarIcon = useColorModeValue('gray.600', 'gray.300');
  const menuBg = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const shadow = useColorModeValue(
    '0 4px 12px rgba(0, 0, 0, 0.1)',
    '0 4px 20px rgba(0, 0, 0, 0.6)'
  );

  return (
    <Flex
      zIndex="100"
      w={{ sm: '100%', md: 'auto' }}
      alignItems="center"
      flexDirection="row"
      bg={menuBg}
      flexWrap={secondary ? { base: 'wrap', md: 'nowrap' } : 'unset'}
      p="10px"
      borderRadius="30px"
      boxShadow={shadow}
    >
      {/* Search Bar */}
      {/* <SearchBar
        placeholder="Search ..."
        me="10px"
        borderRadius="25px"
      /> */}

      {/* Sidebar Responsive for mobile */}
      <SidebarResponsive routes={routes} />

      {/* API Key Modal */}
      <APIModal setApiKey={setApiKey} />

      {/* Theme Toggle */}
      {/* Theme Toggle Button Commented Out
      <Button
        variant="ghost"
        bg="transparent"
        p="0px"
        minW="unset"
        minH="unset"
        h="18px"
        w="max-content"
        onClick={toggleColorMode}
        _hover={{ bg: 'transparent' }}
      >
        <Icon
          me="10px"
          h="18px"
          w="18px"
          color={navbarIcon}
          as={colorMode === 'light' ? IoMdMoon : IoMdSunny}
        />
      </Button>
      */}

      {/* Profile Menu */}
      <Menu>
        <MenuButton p="0px" style={{ position: 'relative' }}>
          <Avatar
            _hover={{ cursor: 'pointer' }}
            color="white"
            bg="gray.700"
            w="40px"
            h="40px"
            src={user?.photoURL || undefined}
            name={user?.displayName || 'Guest'}
          />
        </MenuButton>
        <MenuList
          boxShadow={shadow}
          p="0px"
          mt="10px"
          borderRadius="20px"
          bg={menuBg}
          border="1px solid"
          borderColor={borderColor}
        >
          <Flex w="100%" mb="0px">
            <Text
              ps="20px"
              pt="16px"
              pb="10px"
              w="100%"
              fontSize="sm"
              fontWeight="700"
              color={textColor}
            >
              👋&nbsp; Hey, {user?.displayName || 'Guest'}
            </Text>
          </Flex>
          <Flex flexDirection="column" p="10px">
            {user ? (
              <>
                <NavLink href="/settings">
                  <MenuItem
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                    color={textColor}
                    borderRadius="8px"
                    px="14px"
                  >
                    <Text fontWeight="500" fontSize="sm">
                      Profile Settings
                    </Text>
                  </MenuItem>
                </NavLink>
                {/* Newsletter Settings Commented Out
                <MenuItem
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                  color={textColor}
                  borderRadius="8px"
                  px="14px"
                >
                  <Text fontWeight="500" fontSize="sm">
                    Newsletter Settings
                  </Text>
                </MenuItem>
                */}
                <MenuItem
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800' } }}
                  color="red.400"
                  borderRadius="8px"
                  px="14px"
                  onClick={async () => {
                    try {
                      await logOut();
                    } catch (error) {
                      console.error('Error logging out:', error);
                    }
                  }}
                >
                  <Text fontWeight="500" fontSize="sm">
                    Log out
                  </Text>
                </MenuItem>
              </>
            ) : null}
          </Flex>
        </MenuList>
      </Menu>
    </Flex>
  );
}
