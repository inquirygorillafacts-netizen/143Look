"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';

import { reelLinks } from '@/lib/reel-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  reelNumber: z
    .string()
    .regex(/^\d+$/, { message: 'Only numbers are allowed.' })
    .min(1, { message: 'Please enter a reel number.' }),
});

type FormState = 'idle' | 'loading' | 'success';

export function ReelForm() {
  const [state, setState] = useState<FormState>('idle');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { reelNumber: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setState('loading');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const url = reelLinks[values.reelNumber];

    if (url) {
      setState('success');
      setTimeout(() => {
        window.location.href = url;
      }, 1000);
    } else {
      toast({
        variant: 'destructive',
        title: 'Reel Not Found',
        description: `We couldn't find a product for reel #${values.reelNumber}. Please check the number and try again.`,
      });
      setState('idle');
      form.reset();
    }
  }

  const isLoading = state === 'loading';

  return (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/10 min-h-[250px]">
      <div
        className={cn(
          'transition-opacity duration-300',
          state !== 'idle' ? 'opacity-0' : 'opacity-100'
        )}
      >
        <CardHeader>
          <CardTitle className="font-headline text-center text-2xl">
            Find Your Product
          </CardTitle>
          <CardDescription className="text-center">
            Enter the reel number to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-start gap-2"
            >
              <FormField
                control={form.control}
                name="reelNumber"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input
                        placeholder="e.g. 1247"
                        {...field}
                        className="text-center text-lg h-12"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-left" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg"
                className="h-12"
                disabled={isLoading}
              >
                Go <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </div>

      {(state === 'loading' || state === 'success') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          {state === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg font-semibold text-foreground">
                Finding your link...
              </p>
            </>
          )}
          {state === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="mt-4 text-lg font-semibold text-foreground">
                Success! Redirecting...
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
