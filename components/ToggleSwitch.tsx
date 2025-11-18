import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label, description, icon }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-grow pr-4">
        {icon}
        <div className="flex-grow">
          <label htmlFor={id} className="block text-base font-medium text-brand-light cursor-pointer">
            {label}
          </label>
          <p className="text-sm text-brand-muted">{description}</p>
        </div>
      </div>
      <div className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <div className="w-11 h-6 bg-brand-primary peer-focus:outline-none rounded-full peer dark:bg-brand-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-brand-secondary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-secondary after:border-brand-muted after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
      </div>
    </div>
  );
};

export default ToggleSwitch;