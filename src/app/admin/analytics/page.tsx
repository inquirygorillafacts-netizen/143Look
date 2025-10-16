'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useFirestore } from '@/firebase';
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

  useEffect(() => {
    async function fetchData() {
      if (!firestore) return;
      setIsLoading(true);

      try {
        const reelsQuerySnapshot = await getDocs(collection(firestore, 'reels'));
        const reels = reelsQuerySnapshot.docs.map(doc => ({ id: doc.id, reelNumber: doc.data().reelNumber as string }));

        const analyticsEventsQuery = query(collectionGroup(firestore, 'analytics_events'));
        const analyticsSnapshot = await getDocs(analyticsEventsQuery);
        
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

      } catch (error) {
        console.error("Error fetching analytics data: ", error);
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
            <p className="text-xs text-muted-foreground">in the last 30 days</p>
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
            <p className="text-xs text-muted-foreground">successful redirects</p>
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
            <p className="text-xs text-muted-foreground">from total searches</p>
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
            <p className="text-xs text-muted-foreground">highest click count</p>
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
