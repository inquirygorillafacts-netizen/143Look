export const analyticsData = [
  { reel: '1247', searches: 284, clicks: 231 },
  { reel: '8832', searches: 192, clicks: 170 },
  { reel: '5419', searches: 312, clicks: 290 },
  { reel: '9901', searches: 150, clicks: 110 },
  { reel: '3035', searches: 225, clicks: 201 },
  { reel: '4088', searches: 98, clicks: 45 },
  { reel: '7721', searches: 180, clicks: 175 },
];

const totalSearches = analyticsData.reduce(
  (acc, curr) => acc + curr.searches,
  0
);
const totalClicks = analyticsData.reduce((acc, curr) => acc + curr.clicks, 0);
const mostPopularReel = analyticsData.reduce((prev, current) =>
  prev.clicks > current.clicks ? prev : current
).reel;

export const kpiData = {
  totalSearches,
  totalClicks,
  ctr: ((totalClicks / totalSearches) * 100).toFixed(1),
  mostPopularReel,
};
