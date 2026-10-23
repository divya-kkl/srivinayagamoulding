import React from 'react';
import './WhyChooseUs.css';
import banner from "../images/banner.png";

const WhyChooseUs = ({ shopName = 'Sri vinayaga Moulding' }) => {
  return (
    <div className='banner'>
      <div className="banner2">
        <img src={banner} alt={`${shopName} Banner`} />
      </div>
    </div>
  );
};

export default WhyChooseUs;
