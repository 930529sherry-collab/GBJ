import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, MapIcon, UserGroupIcon, TicketIcon, TrophyIcon, UserCircleIcon, FeedIcon } from './icons/NavIcons';

interface NavItemProps {
  to: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, children, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex-1 flex justify-center items-center p-2 transition-colors duration-300 ${
          isActive ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-light'
        }`
      }
    >
      {children}
    </NavLink>
  );
};

const BottomNav: React.FC = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-brand-primary/90 backdrop-blur-md border-t border-brand-accent/20 z-10 flex items-stretch">
            <NavItem to="/"><MapIcon /></NavItem>
            <NavItem to="/list"><HomeIcon /></NavItem>
            <NavItem to="/friends"><UserGroupIcon /></NavItem>
            <NavItem to="/feed"><FeedIcon /></NavItem>
            <NavItem to="/deals"><TicketIcon /></NavItem>
            <NavItem to="/missions"><TrophyIcon /></NavItem>
            <NavItem to="/profile"><UserCircleIcon /></NavItem>
        </nav>
    );
};

export default BottomNav;