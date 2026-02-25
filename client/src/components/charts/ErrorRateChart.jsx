import { PieChart } from "@mui/x-charts/PieChart";

export default function ErrorRateChart({ dataset }) {
  const rows = dataset?.rows || [];

  const cleanNumber = (v) => {
    if (v === null || v === undefined) return 0;
    const num = Number(String(v).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  if (!rows.length) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Defect Ratio
        </h2>
        <div className="h-[240px] sm:h-[320px] flex items-center justify-center text-gray-400 text-sm">
          Upload dataset to visualize chart
        </div>
      </div>
    );
  }

  /* Detect columns */
  const totalColumn =
    Object.keys(rows[0]).find(k =>
      k.toLowerCase().includes("unit")
    );

  const defectColumn =
    Object.keys(rows[0]).find(k =>
      k.toLowerCase().includes("defect")
    );

  const goodColumn =
    Object.keys(rows[0]).find(k =>
      k.toLowerCase().includes("good")
    );

  let totalUnits = 0;
  let defects = 0;
  let goodUnits = 0;

  rows.forEach(row => {
    totalUnits += cleanNumber(row[totalColumn]);
    defects += cleanNumber(row[defectColumn]);

    if (goodColumn) {
      goodUnits += cleanNumber(row[goodColumn]);
    }
  });

  if (!goodColumn) {
    goodUnits = Math.max(totalUnits - defects, 0);
  }

  const hasData = goodUnits > 0 || defects > 0;

  /* Responsive chart size */
  const chartHeight =
    typeof window !== "undefined" && window.innerWidth < 640
      ? 260
      : 320;

  const innerRadius =
    typeof window !== "undefined" && window.innerWidth < 640
      ? 60
      : 80;

  const outerRadius =
    typeof window !== "undefined" && window.innerWidth < 640
      ? 90
      : 120;

  return (
    <div className="
      bg-white
      rounded-3xl
      shadow-lg
      border border-gray-100
      p-4 sm:p-6 lg:p-8
      hover:shadow-xl
      transition
    ">

      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Defect Ratio
        </h2>
        <p className="text-sm text-gray-500">
          Production quality distribution
        </p>
      </div>

      {!hasData ? (
        <div className="h-[240px] sm:h-[320px] flex items-center justify-center text-gray-400 text-sm">
          No valid data detected
        </div>
      ) : (
        <div className="overflow-x-auto">
<div className="w-full h-[260px] sm:h-[300px] md:h-[320px] flex items-center justify-center">
  <PieChart
    height={260}
    series={[
      {
        data: [
          {
            id: 0,
            value: goodUnits,
            label: "Good Units",
            color: "#3b82f6",
          },
          {
            id: 1,
            value: defects,
            label: "Defects",
            color: "#f59e0b",
          },
        ],
        innerRadius: 50,
        outerRadius: 90,
        paddingAngle: 3,
        cornerRadius: 5,
      },
    ]}
  />
</div>
        </div>
      )}
    </div>
  );
}