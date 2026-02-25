import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import API from "../../api/api";

import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import ProductionTable from "./ProductionTable";
import EditProductionModal from "./EditProductionModal";
import DeleteProductionModal from "./DeleteProductionModal";

export default function Production() {
  /* ================= STATE ================= */

  const [units, setUnits] = useState("");
  const [defects, setDefects] = useState("");
  const [productId, setProductId] = useState("");

  const [products, setProducts] = useState([]);
  const [records, setRecords] = useState([]);

  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [editData, setEditData] = useState(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");

  const fileRef = useRef();

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    API.get("/products").then(res => setProducts(res.data));
    loadRecords();
  }, []);

  const loadRecords = () => {
    API.get("/production").then(res => setRecords(res.data));
  };

  /* Toast auto hide */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ================= ADD RECORD ================= */

  const addRecord = async () => {
    if (!productId) return setToast("Select product");
    if (units < 0 || defects < 0)
      return setToast("Invalid values");

    await API.post("/production", {
      units,
      defects,
      productId,
    });

    setUnits("");
    setDefects("");
    setProductId("");

    loadRecords();
    setToast("Production Added ✅");
  };

  /* ================= UPDATE ================= */

  const updateRecord = async () => {
    await API.patch(`/production/${editData.id}`, editData);
    setEditData(null);
    loadRecords();
    setToast("Record Updated ✏️");
  };

  /* ================= DELETE ================= */

  const deleteRecord = async () => {
    await API.delete(`/production/${deleteId}`);
    setDeleteId(null);
    loadRecords();
  };

  /* ================= CSV UPLOAD ================= */

  const uploadCSV = async () => {
    if (!file) return setToast("Select CSV first");

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    await API.post("/upload-production-csv", formData);

    setUploading(false);
    setFile(null);
    fileRef.current.value = "";

    loadRecords();
    setToast("CSV Uploaded 🚀");
  };

  /* ================= FAST FILTER ================= */

  const filtered = useMemo(() => {
    return records.filter(r =>
      r.product?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
        Production Management
      </h2>

      {/* ADD FORM */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-2xl shadow border p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="number"
            placeholder="Units"
            value={units}
            onChange={e => setUnits(e.target.value)}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            placeholder="Defects"
            value={defects}
            onChange={e => setDefects(e.target.value)}
            className="border rounded-xl p-3"
          />

          <select
            value={productId}
            onChange={e => setProductId(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="">Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={addRecord}
            className="bg-green-600 text-white rounded-xl py-3"
          >
            Add Record
          </button>
        </div>
      </motion.div>

      {/* SEARCH + CSV */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center bg-white border rounded-xl px-4 flex-1 shadow-sm">
          <SearchIcon className="text-gray-400 mr-2" />
          <input
            placeholder="Search product..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="py-3 w-full outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileRef}
            accept=".csv"
            onChange={e => setFile(e.target.files[0])}
          />

          <button
            onClick={uploadCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            {uploading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <CloudUploadIcon fontSize="small" />
            Upload
          </button>
        </div>
      </div>

      {/* TABLE */}
      <ProductionTable
        records={filtered}
        onEdit={setEditData}
        onDelete={setDeleteId}
      />

      {/* MODALS */}
      <EditProductionModal
        editData={editData}
        setEditData={setEditData}
        products={products}
        onUpdate={updateRecord}
        onClose={() => setEditData(null)}
      />

      <DeleteProductionModal
        deleteId={deleteId}
        onDelete={deleteRecord}
        onClose={() => setDeleteId(null)}
      />

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </motion.div>
  );
}