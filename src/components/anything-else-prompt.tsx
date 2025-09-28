'use client';

import { useLanguage } from '@/context/language-context';
import { Button } from './ui/button';
import { HelpCircle } from 'lucide-react';

interface AnythingElsePromptProps {
  onAnythingElse: (hasMoreInfo: boolean) => void;
}

export function AnythingElsePrompt({ onAnythingElse }: AnythingElsePromptProps) {
  const { translations } = useLanguage();
  if (!translations) return null;

  return (
    <div className="space-y-3">
       <p>
          {translations.anythingElsePrompt || "Is there anything else you'd like to add that might help?"}
        </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onAnythingElse(true)}>
          {translations.yes || 'Yes'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onAnythingElse(false)}>
          {translations.no || 'No'}
        </Button>
      </div>
    </div>
  );
}

    