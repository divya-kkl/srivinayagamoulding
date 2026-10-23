import React from 'react';
import './WhyChooseUs.css';
import banner from "../images/banner.png";

const FEATURES = [

];

const WhyChooseUs = ({ shopName = 'Sri vinayaga Moulding', isLoadingSettings }) => {
  return (
    <div className='banner'>

      <div className="banner2">
        <img src={banner} />
      </div>
    </div>
  );
};

export default WhyChooseUs;
