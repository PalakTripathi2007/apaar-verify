import { useEffect, useState } from "react";
import Login from "./Login";
import { apiFetch } from "./api";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function Dashboard({ user, onLogout }) {
  const [flags, setFlags] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = user.role === "aicte_admin";

  async function loadData() {
    try {
      const [flagsRes, studentsRes] = await Promise.all([
        apiFetch("/api/validation/flags"),
        apiFetch("/api/students"),
      ]);
      const flagsData = await flagsRes.json();
      const studentsData = await studentsRes.json();

      setFlags(Array.isArray(flagsData) ? flagsData : []);
      setStudentCount(Array.isArray(studentsData) ? studentsData.length : 0);

      if (!flagsRes.ok) {
        setMessage(flagsData.error || "Could not load flags");
      }
    } catch {
      setMessage("Could not reach the server. Is it running?");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setBusy(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const upRes = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || "Upload failed");

      await apiFetch("/api/validation/run", { method: "POST" });
      await loadData();
      setMessage(`Uploaded ${upData.saved} students and ran validation.`);
    } catch (err) {
      setMessage(err.message);
    }
    setBusy(false);
    e.target.value = "";
  }

  // sirf testing ke liye, sirf AICTE admin ko dikhta hai
  async function handleClear() {
    setBusy(true);
    await apiFetch("/api/students", { method: "DELETE" });
    await apiFetch("/api/validation/run", { method: "POST" });
    await loadData();
    setMessage("Test data cleared.");
    setBusy(false);
  }

  const count = (level) => flags.filter((f) => f.severity === level).length;

  return (
    <div className="page">
      <header>
        <div>
          <h1>APAAR Verify</h1>
          <p className="sub">
            {isAdmin
              ? "AICTE admin view: all institutions"
              : `Institution view: ${user.institutionCode}`}
          </p>
        </div>
        <div className="actions">
          <label className={`btn primary ${busy ? "disabled" : ""}`}>
            {busy ? "Working..." : "Upload CSV"}
            <input type="file" accept=".csv" onChange={handleUpload} disabled={busy} hidden />
          </label>
          {isAdmin && (
            <button className="btn" onClick={handleClear} disabled={busy}>
              Clear test data
            </button>
          )}
          <button className="btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <p className="who">Signed in as {user.email}</p>

      {message && <div className="message">{message}</div>}

      <section className="cards">
        <div className="card">
          <span className="label">Students</span>
          <span className="value">{studentCount}</span>
        </div>
        <div className="card">
          <span className="label">Total flags</span>
          <span className="value">{flags.length}</span>
        </div>
        <div className="card high">
          <span className="label">High</span>
          <span className="value">{count("high")}</span>
        </div>
        <div className="card medium">
          <span className="label">Medium</span>
          <span className="value">{count("medium")}</span>
        </div>
        <div className="card low">
          <span className="label">Low</span>
          <span className="value">{count("low")}</span>
        </div>
      </section>

      {loading ? (
        <p>Loading...</p>
      ) : flags.length === 0 ? (
        <p className="empty">No flags yet. Upload a CSV to start validation.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Severity</th>
              <th>College</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f._id}>
                <td className="type">{f.flagType}</td>
                <td>
                  <span className={`badge ${f.severity}`}>{f.severity}</span>
                </td>
                <td>{f.institutionCode}</td>
                <td>{f.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(readUser());

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;