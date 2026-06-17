import { useState } from "react";

function GoogleForm() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    const payload = {
      id: Date.now(),
      name,
      status,
    };

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwO0Ab0yjCJc618DbK3vgjmW2LreJY0S9NzqZHHzzevZoi1q-Vy_y2Vbq5HhOq9HCsdww/exec",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const result = await response.text();

      alert(result);

      setName("");
      setStatus("");
    } catch (error) {
      console.error(error);
      alert("Error updating sheet");
    }
  };
  console.log("payload",payload);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Employee Update Form</h2>

      <input
        type="text"
        placeholder="Employee Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        Update Google Sheet
      </button>
    </div>
  );
}

export default GoogleForm;