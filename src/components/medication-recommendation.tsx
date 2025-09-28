import type { RecommendMedicationAndDosageOutput } from '@/ai/flows/recommend-medication-and-dosage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { Pill } from 'lucide-react';

interface MedicationRecommendationProps {
  medicationInfo: RecommendMedicationAndDosageOutput;
  condition: string;
}

export function MedicationRecommendation({ medicationInfo, condition }: MedicationRecommendationProps) {
  const { translations } = useLanguage();

  if (!translations) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">{translations.medicationOption.replace('{condition}', condition)}</h3>
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-full">
                <Pill className="h-5 w-5 text-primary" />
             </div>
             <CardTitle className="text-base">{medicationInfo.medicationName}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1 text-muted-foreground">{translations.dosage}</h4>
            <p className="text-sm">{medicationInfo.dosage}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1 text-muted-foreground">{translations.reasoning}</h4>
            <p className="text-sm">{medicationInfo.reasoning}</p>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground !mt-6">
        <strong>{translations.disclaimerTitle}:</strong> {translations.medicationDisclaimer}
      </p>
    </div>
  );
}
