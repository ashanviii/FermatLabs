import { Icon } from './lib/chakra';
import {
  MdHome,
  MdLock,
  MdLayers,
  MdOutlineManageAccounts,
} from 'react-icons/md';
import { IoMdPerson } from 'react-icons/io';
import { IRoute } from './types/navigation';

const routes: IRoute[] = [
  {
    name: 'Chat UI', // 👈 untouched
    path: '/',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    collapse: false,
  },
  {
    name: 'Visa Applications',
    path: '/applications',
    icon: <Icon as={MdLayers} width="20px" height="20px" color="inherit" />,
    collapse: false,
  },
  {
    name: 'User Access',
    path: '/auth',
    icon: <Icon as={IoMdPerson} width="20px" height="20px" color="inherit" />,
    collapse: true,
    items: [
      { name: 'Register', layout: '/auth', path: '/register' },
      { name: 'Sign In', layout: '/auth', path: '/signin' },
    ],
  },
  {
    name: 'Management',
    path: '/admin',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    collapse: true,
    items: [
      { name: 'All Applications', layout: '/admin', path: '/applications' },
      { name: 'New Application', layout: '/admin', path: '/new' },
      { name: 'Manage Users', layout: '/admin', path: '/users' },
    ],
  },
  {
    name: 'Profile Settings',
    path: '/settings',
    icon: (
      <Icon
        as={MdOutlineManageAccounts}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    collapse: false,
  },
];

export default routes;
