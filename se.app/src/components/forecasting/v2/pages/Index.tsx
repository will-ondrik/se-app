import { CrewForecastCalendar } from '@/components/calendar/CrewForecastCalendar';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Crew Forecasting Calendar | Workload Planning for Trades</title>
        <meta name="description" content="Professional crew forecasting and capacity planning calendar for painting and trades companies. Visualize workloads, avoid double-booking, and optimize crew utilization." />
      </Helmet>
      <CrewForecastCalendar />
    </>
  );
};

export default Index;
