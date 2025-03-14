import { PriceChartDetailsClient } from "./price-chart-details-client";

export default function PriceChartDetailsPage({ params }: { params: { id: string } }) {
  return <PriceChartDetailsClient id={params.id} />;
} 