export default function DefectHeatmap({ heatmap }) {
  if (!heatmap || !heatmap.length) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h3 className="text-lg font-semibold mb-4">
        Defect Intensity by Date
      </h3>

      <div className="grid grid-cols-7 gap-2">
        {heatmap.map((h, i) => (
          <div
            key={i}
            className="h-12 rounded"
            style={{
              backgroundColor: `rgba(220,38,38,${Math.min(
                h.defects / 100,
                1
              )})`,
            }}
            title={`${h.date} - ${h.defects} defects`}
          ></div>
        ))}
      </div>
    </div>
  );
}