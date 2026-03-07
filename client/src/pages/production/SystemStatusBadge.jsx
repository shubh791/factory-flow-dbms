export default function SystemStatusBadge({ status }) {

  const config = {
    Operational: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
      label: "Operational",
    },
    Risk: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      label: "Performance Risk",
    },
    Critical: {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      label: "Critical Condition",
    },
  };

  const current =
    config[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-400",
      label: "Unknown",
    };

  return (
    <div
      className={`
        flex items-center gap-2
        px-4 py-2
        rounded-lg
        text-sm font-medium
        border border-gray-200
        ${current.bg} ${current.text}
      `}
    >
      <span
        className={`w-2 h-2 rounded-full ${current.dot}`}
      ></span>

      <span>
        System Status: {current.label}
      </span>
    </div>
  );
}