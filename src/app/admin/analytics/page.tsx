'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart, CreditCard, TrendingUp, Users, Loader } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { useFirestore, errorEmitter, FirestorePermissionError, useMemoFirebase } from '@/firebase';
import { collection, getDocs, collectionGroup, Timestamp } from 'firebase/firestore';
import { format, subDays } from 'date-fns';


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
  ctr: number;
}

interface KpiData {
  totalSearches: number;
  totalClicks: number;
  ctr: string;
  mostPopularReel: string;
}

interface DailyActivity {
    date: string;
    searches: number;
    clicks: number;
}

export default function AnalyticsPage() {
  const firestore = useFirestore();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const topPerformingReels = useMemo(() => {
    // Create a shallow copy before sorting to avoid mutating the original state array
    return [...analyticsData].sort((a,b) => b.ctr - a.ctr).slice(0, 5);
  }, [analyticsData]);


  useEffect(() => {
    async function fetchData() {
      if (!firestore) return;
      setIsLoading(true);
      setError(null);

      const reelsCollection = collection(firestore, 'reels');
      const analyticsEventsCollectionGroup = collectionGroup(firestore, 'analytics_events');

      try {
        const [reelsQuerySnapshot, analyticsSnapshot] = await Promise.all([
           getDocs(reelsCollection).catch(e => {
                const contextualError = new FirestorePermissionError({ operation: 'list', path: 'reels'});
                errorEmitter.emit('permission-error', contextualError);
                throw contextualError;
            }),
           getDocs(analyticsEventsCollectionGroup).catch(e => {
                const contextualError = new FirestorePermissionError({ operation: 'list', path: 'analytics_events (collectionGroup)'});
                errorEmitter.emit('permission-error', contextualError);
                throw contextualError;
            })
        ]);

        const reels = reelsQuerySnapshot.docs.map(doc => ({ id: doc.id, reelNumber: doc.data().reelNumber as string }));
        
        const analyticsByReel: { [key: string]: { searches: number; clicks: number } } = {};
        reels.forEach(reel => {
            analyticsByReel[reel.id] = { searches: 0, clicks: 0 };
        });
        
        const dailyCounts: { [date: string]: { searches: number; clicks: number } } = {};
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const dateKey = format(subDays(today, i), 'yyyy-MM-dd');
            dailyCounts[dateKey] = { searches: 0, clicks: 0 };
        }

        analyticsSnapshot.docs.forEach(eventDoc => {
          const eventData = eventDoc.data();
          const reelId = eventDoc.ref.parent.parent?.id; 
          
          if (reelId && analyticsByReel[reelId]) {
            if (eventData.eventType === 'reel_entry') {
              analyticsByReel[reelId].searches += 1;
            } else if (eventData.eventType === 'click_through') {
              analyticsByReel[reelId].clicks += 1;
            }
          }

          if (eventData.eventTimestamp) {
              const eventDate = (eventData.eventTimestamp as Timestamp).toDate();
              const dateKey = format(eventDate, 'yyyy-MM-dd');
              if (dailyCounts.hasOwnProperty(dateKey)) {
                  if (eventData.eventType === 'reel_entry') {
                    dailyCounts[dateKey].searches += 1;
                  } else if (eventData.eventType === 'click_through') {
                    dailyCounts[dateKey].clicks += 1;
                  }
              }
          }
        });

        const formattedAnalyticsData: AnalyticsData[] = reels.map(reel => {
          const searches = analyticsByReel[reel.id].searches;
          const clicks = analyticsByReel[reel.id].clicks;
          return {
            reel: reel.reelNumber,
            searches,
            clicks,
            ctr: searches > 0 ? (clicks / searches) * 100 : 0,
          }
        }).sort((a,b) => parseInt(a.reel, 10) - parseInt(b.reel, 10));

        setAnalyticsData(formattedAnalyticsData);

        const formattedDailyActivity = Object.entries(dailyCounts).map(([date, counts]) => ({
            date: format(new Date(date), 'MMM d'),
            ...counts
        })).reverse();
        setDailyActivity(formattedDailyActivity);

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
    <div className="flex-1 space-y-4 md:space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
        Analytics Dashboard
      </h2>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Searches</div>
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
            <div className="text-sm font-medium">Total Clicks</div>
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
            <div className="text-sm font-medium">
              Click-Through Rate
            </div>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData?.ctr ?? '0.0'}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">
              Most Clicked Reel
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{kpiData?.mostPopularReel ?? '-'}</div>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
         <Card>
          <CardHeader>
            <div className="font-semibold">Activity Over Last 7 Days</div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 sm:pt-0">
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <RechartsLineChart data={dailyActivity} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis fontSize={12} tickMargin={8}/>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="searches" stroke="var(--color-searches)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false}/>
              </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <div className="font-semibold">Top Performing Reels</div>
            <p className="text-sm text-muted-foreground">By Click-Through Rate (CTR)</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reel</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Searches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformingReels.map((reel, index) => (
                  <TableRow key={`${reel.reel}-${index}`}>
                    <TableCell className="font-medium">#{reel.reel}</TableCell>
                    <TableCell className="text-right">{reel.ctr.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{reel.clicks}</TableCell>
                    <TableCell className="text-right">{reel.searches}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <div className="font-semibold">Reel Performance</div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 sm:pt-0">
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <RechartsBarChart data={analyticsData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="reel"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => `#${value}`}
                fontSize={12}
              />
              <YAxis fontSize={12} tickMargin={8}/>
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
