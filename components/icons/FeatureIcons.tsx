

import React from 'react';

const iconProps = {
  className: "w-24 h-24 text-brand-accent",
  strokeWidth: 1.5,
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
};

const welcomeIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/a55ff5844f91f752507d351563766273bf332d63/%E5%90%89%E7%A5%A5%E7%89%A9.png';

export const WelcomeIcon: React.FC = () => (
  <img src={welcomeIconUrl} alt="Welcome Mascot" className="w-72 h-72 object-contain" />
);

const discoverIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/56b3926c513c87c1cf6cbe82697e392cd03465e6/%E4%B9%BE%E6%9D%AF.png';

export const DiscoverIcon: React.FC = () => (
    <img src={discoverIconUrl} alt="Discover Bars" className="w-72 h-72 object-contain" />
);

const socialIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/56b3926c513c87c1cf6cbe82697e392cd03465e6/%E8%81%9A%E6%9C%83.png';

export const SocialIcon: React.FC = () => (
    <img src={socialIconUrl} alt="Social Gathering" className="w-72 h-72 object-contain" />
);

const rewardIconUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/56b3926c513c87c1cf6cbe82697e392cd03465e6/%E5%AE%8C%E6%88%90%E4%BB%BB%E5%8B%99.png';

export const RewardIcon: React.FC = () => (
  <img src={rewardIconUrl} alt="Complete Missions" className="w-72 h-72 object-contain" />
);
