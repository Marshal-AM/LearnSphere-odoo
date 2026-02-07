'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState, useId } from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ tabs, defaultTab, className, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const layoutId = useId();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={className}>
      <div className="flex gap-1 p-1 bg-gray-100/80 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer',
              activeTab === tab.id
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId={`tab-indicator-${layoutId}`}
                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
      {/* Render all tabs; show/hide via CSS to prevent scroll jumps on switch */}
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={cn('pt-6', tab.id !== activeTab && 'hidden')}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
