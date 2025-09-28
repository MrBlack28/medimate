'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ShieldAlert, Hospital, Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';
import { useLanguage } from '@/context/language-context';
import { RefineConditionsOutput } from '@/ai/flows/refine-conditions';


interface ConditionsListProps {
  conditions: RefineConditionsOutput;
  symptoms: string;
}

export function ConditionsList({ conditions, symptoms }: ConditionsListProps) {
  const { translations } = useLanguage();

  if (!translations) return null;

  if (!conditions || conditions.length === 0) {
    return (
      <Alert variant="default" className="bg-card">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{translations.noSuggestionsFound}</AlertTitle>
        <AlertDescription>
         {translations.noSuggestionsDetails}
        </AlertDescription>
      </Alert>
    )
  }

  const heading = translations.refinedPossibilities;

  return (
    <div className="space-y-4">
       <p className="text-xs text-muted-foreground">
        <strong>{translations.disclaimerTitle}:</strong> {translations.disclaimerText}
      </p>
      <h3 className="font-semibold text-base">{heading}</h3>
      <div className="space-y-3">
        {conditions.map((item) => (
          <Card key={item.conditionName} className="bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-base">{item.conditionName}</CardTitle>
                <Badge variant={item.isEmergency ? "destructive" : "secondary"} className="shrink-0">
                  {item.isEmergency ? translations.emergency : translations.nonEmergency}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              
              {item.isEmergency && item.nearbyHospitals && item.nearbyHospitals.length > 0 && (
                <>
                  <Separator />
                  <div className='space-y-3'>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="p-2 bg-destructive/10 rounded-full">
                          <Hospital className="h-4 w-4 text-destructive" />
                      </div>
                      <h4 className="font-semibold text-sm text-destructive">{translations.nearbyHospitals}</h4>
                    </div>
                    <div className='pl-12 space-y-4'>
                       {item.nearbyHospitals.map(hospital => (
                         <div key={hospital.name}>
                           <p className="font-medium text-sm">{hospital.name}</p>
                           <p className="text-xs text-muted-foreground">{hospital.address}</p>
                           {hospital.phone && (
                             <a href={`tel:${hospital.phone}`} className="flex items-center gap-2 mt-1 text-xs text-primary hover:underline">
                               <Phone className='h-3 w-3'/>
                               <span>{hospital.phone}</span>
                             </a>
                           )}
                         </div>
                       ))}
                    </div>
                  </div>
                </>
              )}

              {item.medication && (
                <>
                  <Separator />
                  <div className='space-y-3'>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                          <ShieldAlert className="h-4 w-4 text-primary" />
                      </div>
                      <h4 className="font-semibold text-sm">{translations.suggestedPrecautions}</h4>
                    </div>
                    <div className='pl-12 space-y-3'>
                       <div>
                         <p className="font-medium text-xs text-muted-foreground">{translations.precautions}</p>
                         <p className="text-sm">{item.medication.precautions}</p>
                       </div>
                       <div>
                          <p className="font-medium text-xs text-muted-foreground">{translations.reasoning}</p>
                          <p className="text-sm">{item.medication.reasoning}</p>
                       </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
