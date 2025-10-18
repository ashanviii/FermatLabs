'use client';
// Chakra imports
import { Flex } from '@chakra-ui/react';
import Image from 'next/image';
import { HSeparator } from '@/components/separator/Separator';

export function SidebarBrand() {
  return (
    <Flex alignItems="center" flexDirection="column">
      <Image
        src="/fermat_bg.jpg" // Make sure this file is inside /public/
        alt="VisaAssist Logo"
        width={146}
        height={40}
        style={{ margin: '30px 0' }}
      />
      <HSeparator mb="20px" w="284px" />
    </Flex>
  );
}

export default SidebarBrand;
