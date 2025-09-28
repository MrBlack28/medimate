'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Send, Stethoscope, User, Camera, AlertCircle, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedConditions, getGreeting, getRefinedConditions } from '@/app/actions';
import { ConditionsList } from '@/components/conditions-list';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { EmergencyNumbers } from '@/components/emergency-numbers';

type ConversationState = 'idle' | 'awaiting_follow_up' | 'awaiting_anything_else';

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: React.ReactNode;
  isThinking?: boolean;
};

type AnalysisContext = {
    symptoms: string;
    photoDataUri?: string;
    questions?: string[];
    answers?: string[];
    additionalInfo?: string;
    location?: {
      latitude: number;
      longitude: number;
    } | null;
}

export default function Home() {
  const { language, translations } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAnalysingSymptoms, setIsAnalysingSymptoms] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext | null>(null);
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialMessageRendered = useRef(false);

  // Request location on initial load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn(`Could not get location: ${error.message}`);
        toast({
          variant: 'default',
          title: translations.locationPermission,
          description: translations.locationPermissionDesc,
        });
      }
    );
  }, [toast, translations]);

  // Initial bot message
  useEffect(() => {
    if (translations && !initialMessageRendered.current) {
      const initialMessage: Message = {
        id: 'initial',
        role: 'bot',
        content: translations.initialBotMessage,
      };
      setMessages([initialMessage]);
      initialMessageRendered.current = true;
    }
  }, [translations]);

  // Scroll to bottom of chat
  useEffect(() => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);
  }, [messages]);

  // Handle camera permission
  useEffect(() => {
    async function getCameraPermission() {
        if (!showCamera) {
             if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            return;
        }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    }
    getCameraPermission();

    return () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [showCamera, toast]);


  // Effect to handle conversation progression
  useEffect(() => {
    if (conversationState === 'awaiting_follow_up' && analysisContext?.questions) {
      const nextQuestionIndex = analysisContext.answers?.length ?? 0;
      if (nextQuestionIndex < analysisContext.questions.length) {
        // Ask the next question if we haven't asked it already
        const lastMessage = messages[messages.length - 1];
        const nextQuestion = analysisContext.questions[nextQuestionIndex];
        if (lastMessage?.role !== 'bot' || lastMessage?.content !== nextQuestion) {
          addMessage('bot', nextQuestion);
        }
      } else {
        // All questions answered, ask if there's anything else
        setConversationState('awaiting_anything_else');
        addMessage('bot', translations.anythingElsePrompt);
      }
    }
  }, [analysisContext, conversationState, messages, translations]);


  const addMessage = (role: 'user' | 'bot', content: React.ReactNode, isThinking = false) => {
    const message: Message = { id: crypto.randomUUID(), role, content, isThinking };
    setMessages((prev) => [...prev, message]);
    return message.id;
  };

  const updateMessage = (id: string, newContent: React.ReactNode, isThinking = false) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content: newContent, isThinking } : msg))
    );
  };
  
  const removeThinkingMessage = () => {
     setMessages((prev) => prev.filter((m) => !m.isThinking));
  }

  const handleSymptomAnalysis = async (symptoms: string, photoDataUri?: string) => {
     setIsAnalysingSymptoms(true);
     const thinkingId = addMessage('bot', 'Thinking...', true);

     try {
        // First check for greetings
        const greetingResponse = await getGreeting(symptoms, language);
        if (greetingResponse) {
          updateMessage(thinkingId, greetingResponse);
          setIsAnalysingSymptoms(false);
          return;
        }

        const result = await getSuggestedConditions({ symptoms, photoDataUri }, language);
        removeThinkingMessage();

        const questions = result.followUpQuestions;

        if(questions && questions.length > 0) {
            setConversationState('awaiting_follow_up');
            // The useEffect will now trigger to ask the first question
            setAnalysisContext({symptoms, photoDataUri, questions, answers: [], location });
        } else {
             // If there are no questions, go straight to refined analysis
             handleRefinedSymptomAnalysis({symptoms, photoDataUri, questions: [], answers: [], location});
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: translations.errorTitle,
          description: error instanceof Error ? error.message : translations.tryAgain,
        });
        const errorContent = translations.errorMessage;
        updateMessage(thinkingId, errorContent);
      } finally {
        setIsAnalysingSymptoms(false);
      }
  }

  const handleRefinedSymptomAnalysis = async (context: AnalysisContext) => {
    if(!context) return;

    setIsAnalysingSymptoms(true);
    const thinkingId = addMessage('bot', 'Analyzing your answers...', true);

    const followUpAnswers = context.questions
        ?.map((q, i) => `${q}\nAnswer: ${context.answers?.[i]}`)
        .join('\n\n') || 'No follow-up answers.';

    try {
        const fullAnswers = context.additionalInfo 
            ? `${followUpAnswers}\n\nAdditional Information: ${context.additionalInfo}`
            : followUpAnswers;

        const refinedConditions = await getRefinedConditions({
            symptoms: context.symptoms,
            photoDataUri: context.photoDataUri,
            followUpAnswers: fullAnswers,
            latitude: context.location?.latitude,
            longitude: context.location?.longitude
        }, language);

        const botResponseContent = <ConditionsList conditions={refinedConditions} symptoms={context.symptoms} />;
        updateMessage(thinkingId, botResponseContent);

    } catch(error) {
         toast({
          variant: 'destructive',
          title: translations.errorTitle,
          description: error instanceof Error ? error.message : translations.tryAgain,
        });
        const errorContent = translations.errorMessage;
        updateMessage(thinkingId, errorContent);
    } finally {
        setIsAnalysingSymptoms(false);
        setConversationState('idle');
        setAnalysisContext(null);
    }
  }


  const handleSymptomSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAnalysingSymptoms || showCamera) return;
    
    const userInput = input;
    setInput('');
    addMessage('user', userInput);
    
    if (conversationState === 'awaiting_follow_up' && analysisContext) {
        const updatedAnswers = [...(analysisContext.answers || []), userInput];
        setAnalysisContext(prev => prev ? { ...prev, answers: updatedAnswers } : null);
    } else if (conversationState === 'awaiting_anything_else' && analysisContext) {
        const lowercasedInput = userInput.toLowerCase();
        // Check for "yes" or "no" in the current language
        const affirmative = translations.yes && lowercasedInput.includes(translations.yes.toLowerCase());
        const negative = translations.no && lowercasedInput.includes(translations.no.toLowerCase());

        if (affirmative) {
             addMessage('bot', translations.anythingElsePlaceholder);
        } else if (negative) {
             handleRefinedSymptomAnalysis(analysisContext!);
        } else {
            // Assume the user is providing the additional info directly
            const updatedContext = { ...analysisContext, additionalInfo: userInput };
            handleRefinedSymptomAnalysis(updatedContext);
        }
    } else if (conversationState === 'idle') {
      await handleSymptomAnalysis(userInput);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const photoDataUri = canvas.toDataURL('image/jpeg');
    setShowCamera(false);
    
    addMessage('user', (
      <>
        <p className="mb-2">{translations.photoInput || 'Here is a photo of my symptoms:'}</p>
        <Image src={photoDataUri} alt="Symptom photo" width={200} height={150} className="rounded-md" />
      </>
    ));

    await handleSymptomAnalysis(translations.visualSymptoms || 'Symptoms in the photo', photoDataUri);
  }


  if (!translations) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const getPlaceholderText = () => {
      if (!translations) return '';
      if (conversationState === 'awaiting_follow_up') {
          return translations.answerPlaceholder || 'Type your answer...';
      }
       if (conversationState === 'awaiting_anything_else') {
          return translations.answerPlaceholder || 'Type your answer...';
      }
      return translations.inputPlaceholder;
  }
  
  const isInputDisabled = isAnalysingSymptoms || showCamera;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-3 p-4 border-b shrink-0 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <Stethoscope className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">
          {translations.appName}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {location && <MapPin className="h-4 w-4 text-green-500" />}
          <EmergencyNumbers />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 md:p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-4 animate-in fade-in duration-300',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'bot' && (
                  <Avatar className="w-8 h-8 border shrink-0">
                    <AvatarFallback className="bg-transparent">
                      <Bot className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xl rounded-lg p-3 shadow-sm',
                    message.role === 'bot'
                      ? 'bg-card'
                      : 'bg-primary text-primary-foreground',
                    message.isThinking ? 'flex items-center gap-2 text-sm' : ''
                  )}
                >
                  {message.isThinking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground italic">
                        {message.content}
                      </span>
                    </>
                  ) : (
                    <div className="prose prose-sm text-foreground prose-p:m-0 prose-headings:m-0 max-w-none break-words">
                       {typeof message.content === 'string' ? (
                        <p>{message.content}</p>
                      ) : (
                        message.content
                      )}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 border shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {showCamera && (
                <div className="flex justify-center">
                     <div className="bg-card p-4 rounded-lg shadow-lg w-full max-w-xl">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                        {hasCameraPermission === false && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                Please allow camera access to use this feature.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="mt-4 flex justify-center">
                            <Button onClick={handleCapture} disabled={hasCameraPermission !== true}>
                                <Camera className="mr-2 h-4 w-4"/>
                                {translations.capture || 'Capture'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
        </ScrollArea>
      </main>

      <footer className="p-4 border-t bg-card/50 backdrop-blur-sm">
        <form
          onSubmit={handleSymptomSubmit}
          className="flex items-center gap-2 max-w-2xl mx-auto"
        >
          <Button type="button" size="icon" variant="ghost" onClick={() => setShowCamera(prev => !prev)}>
            <Camera className={cn("w-5 h-5", showCamera && "text-primary")} />
            <span className="sr-only">Use Camera</span>
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholderText()}
            disabled={isInputDisabled}
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isInputDisabled || !input.trim()}
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">{translations.send}</span>
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Made by udgamana
        </p>
      </footer>
    </div>
  );
}
