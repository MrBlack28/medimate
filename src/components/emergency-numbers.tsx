'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export function EmergencyNumbers() {
    const { translations } = useLanguage();
    if (!translations) return null;

    const handleCall = (number: string) => {
        window.location.href = `tel:${number}`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Phone className="h-4 w-4" />
                    <span className="sr-only">{translations.emergencyNumbers}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{translations.emergencyNumbers}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleCall('102')}>
                    <div className="flex justify-between w-full">
                        <span>{translations.ambulance}</span>
                        <span>102</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleCall('112')}>
                    <div className="flex justify-between w-full">
                        <span>{translations.nationalEmergency}</span>
                        <span>112</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleCall('100')}>
                    <div className="flex justify-between w-full">
                        <span>{translations.police}</span>
                        <span>100</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleCall('101')}>
                    <div className="flex justify-between w-full">
                        <span>{translations.fire}</span>
                        <span>101</span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
