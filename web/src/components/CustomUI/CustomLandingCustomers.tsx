import React, { useState } from 'react';

import { VStack, Image } from '@chakra-ui/react';
import { HashConnect } from 'hashconnect';
import CustomContractTableCustomerRemittances from './CustomContractTableCustomerRemittances';
import CustomHeader from './CustomHeader';

import logo2 from '../../assets/png/logo2.png'; // Import the logo image
import CustomFooter from './CustomFooter';


function CustomLandingCustomers() {
  const [hashConnect] = useState<HashConnect>(new HashConnect());

  return (
    <>
      <CustomHeader hashConnect={hashConnect} />
      <div style={{ display: "flex", flexWrap:"wrap", justifyContent:"space-around", background: "linear-gradient(to right, #EDF1F4, #C3CBDC)", padding: "40px" }}>
        <div>
          <div style={{ marginBottom: "30px" }}>
            <strong style={{ fontSize: "2.7rem", fontFamily: "Noto Sans", fontWeight: "500" }}>Customer Profile</strong>
          </div>
          <CustomContractTableCustomerRemittances hashConnect={hashConnect} />
        </div>
        
        <div>
          <Image
            src={logo2}
            alt="Logo"
            boxSize="720px" // Set the desired size
            objectFit="contain" // Preserve the aspect ratio
            margin="auto" // Center the image vertically
            /*height="inherit"*/
          />
        </div>
      </div>
      <CustomFooter/>
    </>
  );
}

export default CustomLandingCustomers;
