import { Icon } from './lib/chakra';
import {
  MdHome,
  MdLock,
  MdLayers,
  MdOutlineManageAccounts,
  MdFlight,
  MdDirectionsCar,
  MdRestaurant,
  MdHotel,
} from 'react-icons/md';
import { IoMdPerson } from 'react-icons/io';
import { IRoute } from './types/navigation';

const routes: IRoute[] = [
  {
    name: 'Home', // 👈 untouched
    path: '/landing',
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
    name: 'Flight Booking',
    path: '/booking/flights',
    icon: <Icon as={MdFlight} width="20px" height="20px" color="inherit" />,
    collapse: false,
    disabled: true, // Pro feature
  },
  {
    name: 'Hotel Booking',
    path: '/booking/hotels',
    icon: <Icon as={MdHotel} width="20px" height="20px" color="inherit" />,
    collapse: false,
    disabled: true, // Pro feature
  },
  {
    name: 'Transportation',
    path: '/transport',
    icon: <Icon as={MdDirectionsCar} width="20px" height="20px" color="inherit" />,
    collapse: false,
    disabled: true, // Pro feature
  },
  {
    name: 'Food & Dining',
    path: '/food',
    icon: <Icon as={MdRestaurant} width="20px" height="20px" color="inherit" />,
    collapse: false,
    disabled: true, // Pro feature
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
