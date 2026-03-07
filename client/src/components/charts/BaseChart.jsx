import React from "react";
import ReactECharts from "echarts-for-react";

/*
=========================================================
BASE CHART – ENTERPRISE VERSION
Clean container | No double card wrapping
Proper resize handling
=========================================================
*/

export default function BaseChart({
  option,
  height = "360px",
  loading = false,
  className = "",
}) {
  if (!option) return null;

  return (
    <div
      className={`w-full ${className}`}
      style={{ height }}
    >
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge={true}
        lazyUpdate={false}
        showLoading={loading}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}