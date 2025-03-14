import { PriceChartDetailsClient } from "./price-chart-details-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PriceChartDetailsPage({ params, searchParams }: PageProps) {
  const [{ id }, _] = await Promise.all([params, searchParams]);
  return <PriceChartDetailsClient id={id} />;
} 