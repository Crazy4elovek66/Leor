import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const slides = [
    {
      icon: <HeartHandshake className="w-10 h-10 text-[#D8B4B0]" />,
      title: 'Подарки начинаются с понимания',
      description: 'Leor помогает близким людям лучше понимать друг друга и делать по-настоящему личные подарки.',
      cta: 'Продолжить',
    },
    {
      icon: <Sparkles className="w-10 h-10 text-[#D8B4B0]" />,
      title: 'Создайте свою карту',
      description: 'Сохраните то, что вас действительно отражает: интересы, размеры, мечты и важные цели.',
      cta: 'Начать',
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-[#D8B4B0]" />,
      title: 'Только для близких',
      description: 'Вы сами решаете, какие разделы профиля увидят участники вашего круга.',
      cta: 'Создать профиль',
    },
  ];

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const slide = slides[currentStep];

  return (
    <div className="flex flex-col items-center justify-between min-h-[80vh] py-8 text-center px-4">
      <div className="flex items-center space-x-2 pt-4">
        <span className="text-xl font-bold font-serif text-[#F5F5F7]">Secret Circle</span>
      </div>

      <div className="w-full max-w-sm bg-[#17171A] border border-[#26262B] rounded-[28px] p-8 my-auto transition-all duration-300 ease-out shadow-xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#D8B4B0]/10 border border-[#D8B4B0]/20 flex items-center justify-center mb-6">
          {slide.icon}
        </div>
        <h2 className="text-xl font-bold text-[#F5F5F7] mb-3">{slide.title}</h2>
        <p className="text-sm text-[#A1A1AA] leading-relaxed mb-8">{slide.description}</p>

        {/* Step indicators */}
        <div className="flex items-center justify-center space-x-2 mb-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-6 bg-[#D8B4B0]' : 'w-1.5 bg-[#26262B]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm">
        <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
          <span>{slide.cta}</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
