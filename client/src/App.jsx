import { useEffect, useState } from "react";
import Login from "./Login";
import Verify from "./Verify";
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
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [issued, setIssued] = useState(null);

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
      setStudents(Array.isArray(studentsData) ? studentsData : []);

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
    setIssued(null);
    setMessage("Test data cleared.");
    setBusy(false);
  }

  async function handleIssue(id) {
    setBusy(true);
    setMessage("");
    setIssued(null);
    try {
      const res = await apiFetch(`/api/records/issue/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not issue record");
      setIssued(data);
    } catch (err) {
      setMessage(err.message);
    }
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

      {issued && (
        <div className="issued">
          <img src={issued.qr} alt="QR code" width="160" height="160" />
          <div>
            <h3>Verified record issued</h3>
            <p>Anyone can check this record using the link below.</p>
            <a href={issued.verifyUrl} target="_blank" rel="noreferrer">
              {issued.verifyUrl}
            </a>
            <div>
              <button className="btn" onClick={() => setIssued(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="cards">
        <div className="card">
          <span className="label">Students</span>
          <span className="value">{students.length}</span>
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
      ) : (
        <>
          <h2>Flags</h2>
          {flags.length === 0 ? (
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

          <h2>Students</h2>
          {students.length === 0 ? (
            <p className="empty">No students yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>APAAR ID</th>
                  <th>College</th>
                  <th>Programme</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.fullName}</td>
                    <td>{s.apaarId || "missing"}</td>
                    <td>{s.institutionCode}</td>
                    <td>{s.program}</td>
                    <td>
                      <button
                        className="btn small"
                        onClick={() => handleIssue(s._id)}
                        disabled={busy}
                      >
                        Issue record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

function AuthApp() {
  const [user, setUser] = useState(readUser());

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}

function App() {
  const path = window.location.pathname;

  // QR ka link: bina login ke chalta hai
  if (path.startsWith("/verify/")) {
    return <Verify code={path.split("/")[2]} />;
  }
  return <AuthApp />;
}

export default App;