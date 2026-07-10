
import { useState } from "react";
import { uploadFile } from "../utils/auth";

function FileUpload() {

  const [selectedFile, setSelectedFile] = useState(null);
  const formData = new FormData();
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {

  if (!selectedFile) {
    alert("Please select a file.");
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();

    formData.append("file", selectedFile);

    const result = await uploadFile(formData);

    if (result.success) {
      alert(result.message);

      console.log(result.data);

      // Optional
      setSelectedFile(null);

      // Later we'll refresh the upload history here
      // fetchUploadHistory();

    } else {
      alert(result.message);
    }

  } catch (error) {
    console.error(error);
    alert("File upload failed.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <div className="rounded-2xl bg-white shadow-lg border p-8">
        <h2 className="text-2xl font-semibold text-[#24384F]">Upload Assessment File</h2>
        <div className="mt-8">
          <label className="block mb-2 font-medium">Select Excel File</label>
          <input type="file" accept=".xlsx,.xls" className="block w-full rounded-lg border border-gray-300 p-3" onChange={handleFileChange} />
        </div>

        {selectedFile && (
          <p className="mt-3"> Selected: <b>{selectedFile.name}</b> </p>
        )}

        <div className="mt-6 flex justify-end">
          <button className="rounded-lg bg-[#D89A00] px-8 py-3 text-white hover:bg-[#bf8600]" onClick={handleUpload}>Upload File</button>
        </div>
      </div>

      {/* <div className="mt-8 rounded-2xl border bg-white p-6 shadow">
      <h3 className="mb-4 text-xl font-semibold text-[#24384F]">Current Active File</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500">File Name</p>
          <p className="font-medium">Leadership_Reset_Diagnostic.xlsx</p>
        </div>
        <div>
          <p className="text-gray-500">Uploaded By</p>
          <p className="font-medium">Kumar Suneel </p>
        </div>
        <div>
          <p className="text-gray-500">Uploaded On</p>
          <p className="font-medium">09 Jul 2026 11:15 AM</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <span className="rounded-full bg-green-100 px-4 py-1 text-green-700">Active </span>
        </div>
      </div>
    </div> */}
    </div>
  )
}

export default FileUpload;


