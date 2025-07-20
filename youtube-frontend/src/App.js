import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [ping, setPing] = useState("");

  useEffect(() => {
    axios.get("http://localhost:4000/api/ping")
      .then(res => setPing(res.data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>YouTube Companion Dashboard</h1>
      <p>Backend says: {ping}</p>
    </div>
  );
}

export default App;
