import KPIStats from "../components/charts/KPIStats";
import ProductionChart from "../components/charts/ProductionChart";
import EmployeeTrendChart from "../components/charts/EmployeeTrendChart";
import EfficiencyChart from "../components/charts/EfficiencyChart";
import ErrorRateChart from "../components/charts/ErrorRateChart";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileRef = useRef();

  /* LOAD DATASET */
  const loadDataset = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/datasets/latest");

      if (!res.data) return;

      // Normalize dataset shape
      const normalized = {
        ...res.data,
        rows:
          res.data.rows ||
          res.data.data ||
          res.data.dataset ||
          [],
      };

      setDataset(normalized);
    } catch (err) {
      console.log("Dataset fetch failed", err);
    }
  };

  useEffect(() => {
    loadDataset();
  }, []);

  /* UPLOAD */
  const uploadFile = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      await axios.post("http://localhost:5000/api/upload/upload-dataset", formData);

      await loadDataset();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);

      setFile(null);
      fileRef.current.value = "";
    } catch (err) {
      console.log(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen p-4 sm:p-6 md:p-10 space-y-8"
    >
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Industrial Analytics Dashboard
        </h1>
        <p className="text-gray-500">
          Upload dataset & generate insights
        </p>
      </div>

      {/* UPLOAD */}
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col lg:flex-row gap-4 justify-between">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={uploadFile}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl"
        >
          {loading ? "Uploading..." : "Upload Dataset"}
        </button>
      </div>

      {success && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg w-fit">
          Dataset uploaded successfully 🚀
        </div>
      )}

      {/* KPI */}
      <KPIStats dataset={dataset} />

      {/* CHART GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        <ProductionChart dataset={dataset} />
        <EmployeeTrendChart dataset={dataset} />
        <EfficiencyChart dataset={dataset} />
        <ErrorRateChart dataset={dataset} />
      </div>
    </motion.div>
  );
}