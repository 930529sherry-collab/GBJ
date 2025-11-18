import React from 'react';

const logoUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/56b3926c513c87c1cf6cbe82697e392cd03465e6/%E4%B9%BE%E4%B8%8D%E6%8F%AA%E5%8E%BB%E8%83%8C.png';

const SplashScreen: React.FC<{ isExiting: boolean }> = ({ isExiting }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-primary text-brand-light ${
        isExiting ? 'animate-fade-out' : ''
      }`}
    >
      <div className="animate-fade-in mb-8">
        <img src={logoUrl} alt="乾不揪 Logo" className="w-72 h-72 object-contain" />
      </div>
      <div className="text-center text-brand-muted text-3xl font-semibold tracking-wider animate-pulse">
        <p>不怕沒人喝</p>
        <p>只怕你不揪</p>
      </div>
    </div>
  );
};

export default SplashScreen;