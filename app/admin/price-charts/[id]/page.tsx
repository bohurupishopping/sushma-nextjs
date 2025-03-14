import { PriceChartDetailsClient } from "./price-chart-details-client";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: "Price Chart Details | Admin Panel",
  description: "View and manage price chart details",
  themeColor: "#f97316", // orange-500 color
};

export default async function PriceChartDetailsPage({ params, searchParams }: PageProps) {
  const [{ id }, _] = await Promise.all([params, searchParams]);
  return <PriceChartDetailsClient id={id} />;
} 