import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import API from "../../api/api";

import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import ProductionTable from "./ProductionTable";
import EditProductionModal from "./EditProductionModal";
import DeleteProductionModal from "./DeleteProductionModal";

export default function Production() {

  const [units,setUnits] = useState("");
  const [defects,setDefects] = useState("");
  const [productId,setProductId] = useState("");
  const [employeeId,setEmployeeId] = useState("");

  const [products,setProducts] = useState([]);
  const [employees,setEmployees] = useState([]);
  const [records,setRecords] = useState([]);

  const [search,setSearch] = useState("");
  const [deleteId,setDeleteId] = useState(null);
  const [editData,setEditData] = useState(null);

  const [showClearModal,setShowClearModal] = useState(false);

  const [file,setFile] = useState(null);
  const [uploading,setUploading] = useState(false);

  const [toast,setToast] = useState("");

  const fileRef = useRef();

  /* ================= LOAD DATA ================= */

  useEffect(()=>{

    API.get("/products").then(res=>setProducts(res.data));

    API.get(`/employees?t=${Date.now()}`)
    .then(res=>setEmployees(res.data));

    loadRecords();

  },[]);

  const loadRecords = async ()=>{
    const res = await API.get(`/production?t=${Date.now()}`);
    setRecords(res.data);
  };

  /* ================= AUTO REFRESH ================= */

  useEffect(()=>{
    const interval = setInterval(()=>{
      loadRecords();
    },10000);

    return ()=>clearInterval(interval);
  },[]);

  /* ================= TOAST ================= */

  useEffect(()=>{
    if(!toast) return;

    const timer = setTimeout(()=>{
      setToast("");
    },2500);

    return ()=>clearTimeout(timer);

  },[toast]);

  /* ================= ADD RECORD ================= */

  const addRecord = async ()=>{

    if(!productId) return setToast("Select product");
    if(!employeeId) return setToast("Select employee");

    if(units < 0 || defects < 0)
      return setToast("Invalid values");

    try{

      await API.post("/production",{
        units:Number(units),
        defects:Number(defects),
        productId:Number(productId),
        employeeId:Number(employeeId)
      });

      setUnits("");
      setDefects("");
      setProductId("");
      setEmployeeId("");

      await loadRecords();

      setToast("Production record added");

    }catch{
      setToast("Failed to add record");
    }

  };

  /* ================= UPDATE ================= */

  const updateRecord = async ()=>{

    try{

      await API.patch(`/production/${editData.id}`,editData);

      setEditData(null);

      await loadRecords();

      setToast("Record updated");

    }catch{
      setToast("Update failed");
    }

  };

  /* ================= DELETE ONE ================= */

  const deleteRecord = async ()=>{

    try{

      await API.delete(`/production/${deleteId}`);

      setDeleteId(null);

      await loadRecords();

      setToast("Record deleted");

    }catch{
      setToast("Delete failed");
    }

  };

  /* ================= DELETE ALL ================= */

  const clearAllRecords = async ()=>{

    try{

      const res = await API.delete("/production/clear");

      setShowClearModal(false);

      await loadRecords();

      setToast(`${res.data.deletedCount || 0} records removed`);

    }catch{
      setToast("Bulk delete failed");
    }

  };

  /* ================= CSV UPLOAD ================= */

  const uploadCSV = async ()=>{

    if(!file){
      setToast("Select CSV first");
      return;
    }

    try{

      const formData = new FormData();
      formData.append("file",file);

      setUploading(true);

      await API.post(
        "/production-upload/upload-production-csv",
        formData,
        {headers:{ "Content-Type":"multipart/form-data"}}
      );

      setUploading(false);

      setFile(null);

      if(fileRef.current) fileRef.current.value="";

      await loadRecords();

      setToast("CSV uploaded successfully");

    }catch{

      setUploading(false);

      setToast("Upload failed");

    }

  };

  /* ================= FILTER ================= */

  const filtered = useMemo(()=>{
    return records.filter(r =>
      r.product?.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
    );
  },[records,search]);

  return(

<motion.div
initial={{opacity:0}}
animate={{opacity:1}}
className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen"
>

<h2 className="text-3xl font-semibold text-slate-900">
Production Data Management
</h2>

{/* ================= ADD FORM ================= */}

<div className="bg-white rounded-2xl border border-slate-200 p-6">

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

<input
type="number"
min="0"
placeholder="Units Produced"
value={units}
onChange={e=>setUnits(e.target.value)}
className="border rounded-lg p-3"
/>

<input
type="number"
min="0"
placeholder="Defective Units"
value={defects}
onChange={e=>setDefects(e.target.value)}
className="border rounded-lg p-3"
/>

<select
value={productId}
onChange={e=>setProductId(e.target.value)}
className="border rounded-lg p-3"
>
<option value="">Select Product</option>
{products.map(p=>(
<option key={p.id} value={p.id}>
{p.name}
</option>
))}
</select>

<select
value={employeeId}
onChange={e=>setEmployeeId(e.target.value)}
className="border rounded-lg p-3"
>
<option value="">Select Employee</option>
{employees.map(emp=>(
<option key={emp.id} value={emp.id}>
{emp.name} ({emp.department?.name})
</option>
))}
</select>

<button
onClick={addRecord}
className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-3"
>
Save Record
</button>

</div>

</div>

{/* ================= SEARCH + CSV ================= */}

<div className="flex flex-col md:flex-row gap-4 items-center">

<div className="flex items-center bg-white border rounded-lg px-4 flex-1">
<SearchIcon className="text-slate-400 mr-2"/>
<input
placeholder="Search by product..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="py-3 w-full outline-none"
/>
</div>

<div className="flex items-center gap-3">

<input
type="file"
ref={fileRef}
accept=".csv"
onChange={(e)=>setFile(e.target.files[0])}
/>

<button
onClick={uploadCSV}
disabled={uploading}
className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-lg"
>
{uploading ?
<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
:
<CloudUploadIcon fontSize="small"/>
}
Upload CSV
</button>

<button
onClick={()=>setShowClearModal(true)}
className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg"
>
<DeleteForeverIcon fontSize="small"/>
Delete All
</button>

</div>

</div>

<ProductionTable
records={filtered}
onEdit={setEditData}
onDelete={setDeleteId}
/>

<EditProductionModal
editData={editData}
setEditData={setEditData}
products={products}
employees={employees}
onUpdate={updateRecord}
onClose={()=>setEditData(null)}
/>

<DeleteProductionModal
deleteId={deleteId}
onDelete={deleteRecord}
onClose={()=>setDeleteId(null)}
/>

{/* DELETE ALL MODAL */}

{showClearModal && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

<h3 className="text-lg font-semibold mb-4">
Confirm Bulk Deletion
</h3>

<p className="text-sm text-slate-600 mb-6">
Are you sure you want to delete all production records?
This action cannot be undone.
</p>

<div className="flex justify-end gap-3">

<button
onClick={()=>setShowClearModal(false)}
className="px-4 py-2 border rounded-lg"
>
Cancel
</button>

<button
onClick={clearAllRecords}
className="px-4 py-2 bg-red-600 text-white rounded-lg"
>
Delete All
</button>

</div>

</div>

</div>
)}

{toast && (
<div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-lg text-sm">
{toast}
</div>
)}

</motion.div>

);

}