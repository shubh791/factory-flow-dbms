import { useState } from "react";

/*
=========================================================
DATASET HOOK (DEPRECATED - RELATIONAL MODE ACTIVE)
This project now uses direct DBMS relational architecture.
Dataset upload system disabled.
=========================================================
*/

export default function useDataset() {
  const [dataset] = useState(null);
  const [loading] = useState(false);
  const [success] = useState(false);
  const [error] = useState(null);

  const handleUpload = async () => {
    console.warn(
      "Dataset upload is disabled. System now uses relational DB architecture."
    );
  };

  return {
    dataset,
    loading,
    success,
    error,
    handleUpload,
  };
}