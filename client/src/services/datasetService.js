import API from "../api/api";

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post("/upload/dataset", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};