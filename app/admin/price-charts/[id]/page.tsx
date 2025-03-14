import { PriceChartDetailsClient } from "./price-chart-details-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function PriceChartDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <PriceChartDetailsClient id={id} />;
} 