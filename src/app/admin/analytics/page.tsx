'use client';

import { useEffect, useState } from 'react';
import { BarChart, CreditCard, TrendingUp, Users, Loader } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, getDocs, collectionGroup, query } from 'firebase/firestore';

const chartConfig = {
  searches: {
    label: 'Searches',
    color: 'hsl(var(--primary))',
  },
  clicks: {
    label: 'Clicks',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

interface AnalyticsData {
  reel: string;
  searches: number;
  clicks: number;
}

interface KpiData {
  totalSearches: number;
  totalClicks: number;
  ctr: string;
  mostPopularReel: string;
}

export default function AnalyticsPage() {
  const firestore = useFirestore();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function fetchData() {
      if (!firestore) return;
      setIsLoading(true);
      setError(null);

      const reelsCollection = collection(firestore, 'reels');
      const analyticsEventsCollectionGroup = collectionGroup(firestore, 'analytics_events');

      const reelsQuerySnapshotPromise = getDocs(reelsCollection).catch(e => {
        const contextualError = new FirestorePermissionError({ operation: 'list', path: 'reels'});
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
      });

      const analyticsSnapshotPromise = getDocs(analyticsEventsCollectionGroup).catch(e => {
        const contextualError = new FirestorePermissionError({ operation: 'list', path: 'analytics_events (collectionGroup)'});
        errorEmitter.emit('permission-error', contextualError);
        throw contextualError;
      });

      try {
        const [reelsQuerySnapshot, analyticsSnapshot] = await Promise.all([
          reelsQuerySnapshotPromise,
          analyticsSnapshotPromise
        ]);

        const reels = reelsQuerySnapshot.docs.map(doc => ({ id: doc.id, reelNumber: doc.data().reelNumber as string }));
        
        const analyticsByReel: { [key: string]: { searches: number; clicks: number } } = {};

        for (const reel of reels) {
            analyticsByReel[reel.id] = { searches: 0, clicks: 0 };
        }
        
        analyticsSnapshot.docs.forEach(eventDoc => {
          const eventData = eventDoc.data();
          const reelId = eventDoc.ref.parent.parent?.id; // analytics_events is a subcollection
          if (reelId && analyticsByReel[reelId]) {
            if (eventData.eventType === 'reel_entry') {
              analyticsByReel[reelId].searches += 1;
            } else if (eventData.eventType === 'click_through') {
              analyticsByReel[reelId].clicks += 1;
            }
          }
        });

        const formattedAnalyticsData: AnalyticsData[] = reels.map(reel => ({
          reel: reel.reelNumber,
          ...analyticsByReel[reel.id]
        })).sort((a,b) => parseInt(a.reel, 10) - parseInt(b.reel, 10));

        setAnalyticsData(formattedAnalyticsData);

        const totalSearches = formattedAnalyticsData.reduce((acc, curr) => acc + curr.searches, 0);
        const totalClicks = formattedAnalyticsData.reduce((acc, curr) => acc + curr.clicks, 0);
        
        let mostPopularReel = '-';
        if (formattedAnalyticsData.length > 0) {
            const popularReel = formattedAnalyticsData.reduce((prev, current) =>
                prev.clicks > current.clicks ? prev : current
            );
            if (popularReel.clicks > 0) {
                mostPopularReel = popularReel.reel;
            }
        }
        
        setKpiData({
          totalSearches,
          totalClicks,
          ctr: totalSearches > 0 ? ((totalClicks / totalSearches) * 100).toFixed(1) : '0.0',
          mostPopularReel,
        });

      } catch (err) {
        if (err instanceof FirestorePermissionError) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred while fetching analytics data.");
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [firestore]);
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-destructive">Error Loading Analytics</h1>
        <p className="text-muted-foreground max-w-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">
        Analytics Dashboard
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData?.totalSearches.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData?.totalClicks.toLocaleString() ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Click-Through Rate
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData?.ctr ?? '0.0'}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Popular Reel
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{kpiData?.mostPopularReel ?? '-'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reel Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <RechartsBarChart data={analyticsData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="reel"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="searches"
                fill="var(--color-searches)"
                radius={4}
              />
              <Bar dataKey="clicks" fill="var(--color-clicks)" radius={4} />
            </RechartsBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
