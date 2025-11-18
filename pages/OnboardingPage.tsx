
import React, { useState } from 'react';
import { WelcomeIcon, DiscoverIcon, SocialIcon, RewardIcon } from '../components/icons/FeatureIcons';

const onboardingSteps = [
    {
        icon: <WelcomeIcon />,
        title: '歡迎來到 乾不揪',
        description: '您的終極酒吧探險夥伴。輕鬆解決找酒吧、揪朋友、訂位的煩惱。',
    },
    {
        icon: <DiscoverIcon />,
        title: '探索附近酒吧',
        description: '使用地圖輕鬆尋找您附近的特色酒吧，查看評價、菜單與即時空位狀況。',
    },
    {
        icon: <SocialIcon />,
        title: '揪上三五好友',
        description: '查看好友的所在位置與打卡動態，今晚想喝酒，一個都不能少！',
    },
    {
        icon: <RewardIcon />,
        title: '完成喝酒任務',
        description: '挑戰各種趣味任務，賺取「酒幣」，並兌換合作店家的獨家優惠與獎勵。',
    },
];

const OnboardingPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };
    
    const isLastStep = currentStep === onboardingSteps.length - 1;

    return (
        <div className="min-h-screen w-full bg-brand-primary flex flex-col justify-between items-center p-8 font-sans animate-fade-in text-brand-light">
            {/* Skip Button */}
            <div className="w-full flex justify-end">
                <button
                    onClick={onComplete}
                    className="text-brand-muted hover:text-brand-accent transition-colors font-semibold"
                >
                    跳過
                </button>
            </div>
            
            {/* Content Area */}
            <div className="flex-grow flex flex-col items-center justify-center text-center -mt-10">
                <div className="mb-8 transition-all duration-300 transform">
                    {onboardingSteps[currentStep].icon}
                </div>
                <h1 className="text-3xl font-bold text-brand-accent mb-4 tracking-wider">
                    {onboardingSteps[currentStep].title}
                </h1>
                <p className="max-w-xs text-brand-muted leading-relaxed">
                    {onboardingSteps[currentStep].description}
                </p>
            </div>

            {/* Navigation */}
            <div className="w-full max-w-sm flex flex-col items-center space-y-6">
                {/* Dots */}
                <div className="flex justify-center space-x-2">
                    {onboardingSteps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                currentStep === index ? 'bg-brand-accent w-6' : 'bg-brand-accent/30'
                            }`}
                        />
                    ))}
                </div>

                {/* Next/Finish Button */}
                <button
                    onClick={handleNext}
                    className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors shadow-lg shadow-brand-accent/30"
                >
                    {isLastStep ? '開始探索' : '下一步'}
                </button>
            </div>
        </div>
    );
};

export default OnboardingPage;
