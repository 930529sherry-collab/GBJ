

import React from 'react';

const iconProps = {
  className: "w-7 h-7",
  strokeWidth: 1.5,
};

const barListIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/67b6f0a9a1e926327fbbe08704f3c8c374f8c453/%E9%85%92%E5%90%A7%20%E5%B0%8E%E8%A6%BD.png';
export const HomeIcon: React.FC = () => (
    <img src={barListIconUrl} alt="Bar List" className="w-7 h-7" />
);

export const MapIcon: React.FC = () => (
    <svg {...iconProps} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-.553-.894L15 2m-6 5l6-3m0 0l6 3m-6-3v10" />
    </svg>
);

const friendsIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/142d996cdf4201de0f7e2c98ec1ff8de045def2e/%E5%A5%BD%E5%8F%8B.png';
const profileIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/67b6f0a9a1e926327fbbe08704f3c8c374f8c453/%E5%80%8B%E4%BA%BA.png';

export const UserGroupIcon: React.FC = () => (
    <img src={friendsIconUrl} alt="Friends Map" className="w-11 h-11" />
);

const feedIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/e6f9b0d2cbf2ade5a8e6a572e5a43ea590ae4975/%E7%A4%BE%E7%BE%A4.png';
export const FeedIcon: React.FC = () => (
    <img src={feedIconUrl} alt="Social Feed" className="w-7 h-7" />
);

const dealsIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/e6f9b0d2cbf2ade5a8e6a572e5a43ea590ae4975/%E5%84%AA%E6%83%A0%E5%8D%B72.png';
export const TicketIcon: React.FC = () => (
    <img src={dealsIconUrl} alt="Deals" className="w-12 h-12" />
);

const missionIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/0bd1d613497d002c111995566e8a7b9ab0d50f11/%E4%BB%BB%E5%8B%99.png';
export const TrophyIcon: React.FC<{className?: string}> = ({className}) => (
  <img src={missionIconUrl} alt="Missions" className="w-8 h-8" />
);

export const UserCircleIcon: React.FC = () => (
    <img src={profileIconUrl} alt="Profile" className="w-8 h-8" />
);

export const MapPinIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
  </svg>
);

export const UserPlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || iconProps.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
);