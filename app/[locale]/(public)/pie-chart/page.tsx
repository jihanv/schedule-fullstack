import type { Metadata } from "next";

import PieChartGenerator from "@/components/pie-chart-generator";

type PieChartPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: PieChartPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === "ja") {
    return {
      title: "白黒・印刷用の円グラフ作成ツール | Class Planner",
      description:
        "ワークシート、テスト、配布資料、白黒印刷向けの円グラフを無料で作成できます。カテゴリー名やパーセント、引き出し線を設定し、SVGまたはPNGでダウンロードできます。",
    };
  }

  return {
    title: "Free Black & White Pie Chart Maker for Printing | Class Planner",
    description:
      "Create free printable black-and-white pie charts for worksheets, tests, handouts, and photocopies. Add category labels, percentages, and leader lines, then download as SVG or PNG.",
  };
}

export default function PieChartPage() {
  return <PieChartGenerator />;
}
