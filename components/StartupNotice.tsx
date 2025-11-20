
import React, { useState, useEffect } from 'react';
import { appConfig } from '../config';

export const StartupNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenNotice = sessionStorage.getItem('hasSeenStartupNotice');
    if (appConfig.startupNotice.enabled && !hasSeenNotice) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenStartupNotice', 'true');
  };

  if (!isVisible) return null;

  // 智能解析文本内容
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-2" />; // 空行作为间距

      // 匹配 "1. " 或 "1、" 开头的列表项
      const listMatch = trimmed.match(/^(\d+)[.、]\s*(.*)/);
      
      if (listMatch) {
        return (
          <div key={index} className="flex items-start gap-3 mb-3 last:mb-0 group/item">
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-extrabold mt-0.5 ring-1 ring-primary/20 group-hover/item:bg-primary group-hover/item:text-white transition-colors duration-300">
              {listMatch[1]}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed text-justify font-medium pt-0.5">
              {listMatch[2]}
            </p>
          </div>
        );
      }

      // 普通段落
      return (
        <p key={index} className="text-sm text-text-secondary leading-relaxed mb-2 text-justify font-medium opacity-90">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fadeIn transition-opacity" 
        onClick={handleClose} 
      />
      
      {/* Main Card */}
      <div className="relative bg-white w-full max-w-sm sm:max-w-[26rem] rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn z-10 flex flex-col ring-1 ring-white/50">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 via-green-50/30 to-transparent -z-10" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />

        {/* Header Section */}
        <div className="pt-10 px-8 pb-6 text-center relative">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6 rotate-3 transform hover:rotate-6 transition-all duration-500 border-2 border-white">
                 <span className="text-3xl drop-shadow-sm">👋</span>
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight">
                {appConfig.startupNotice.title}
            </h3>
        </div>
        
        {/* Content Section */}
        <div className="px-6 sm:px-8 max-h-[55vh] overflow-y-auto custom-scrollbar">
           <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 shadow-inner">
              {renderContent(appConfig.startupNotice.content)}
           </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 sm:p-8 pt-6 bg-white">
          <button 
            onClick={handleClose}
            className="group w-full py-3.5 bg-gradient-to-r from-primary to-green-600 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            
            <span className="relative">{appConfig.startupNotice.buttonText}</span>
            <svg className="w-4 h-4 relative transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
