import { useEffect, useState } from "react";
import { API } from "./api";

const LABELS = {
  VALID: { title: "Verified record", note: "This record is genuine and has not been altered.", cls: "ok" },
  TAMPERED: { title: "Record altered", note: "This record does not match its digital seal. Do not trust it.", cls: "bad" },
  REVOKED: { title: "Record revoked", note: "This record was cancelled by the issuer.", cls: "warn" },
  NOT_FOUND: { title: "Record not found", note: "No record exists for this code.", cls: "neutral" },
};

export default function Verify({ code }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/verify/${code}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setError("Could not reach the verification server."));
  }, [code]);

  if (error) return <div className="verify-wrap"><div className="verify-card neutral"><h2>{error}</h2></div></div>;
  if (!data) return <div className="verify-wrap"><p>Checking...</p></div>;

  const info = LABELS[data.result] || LABELS.NOT_FOUND;
  const s = data.student;

  return (
    <div className="verify-wrap">
      <div className={`verify-card ${info.cls}`}>
        <h2>{info.title}</h2>
        <p>{info.note}</p>

        {s && (
          <dl>
            <dt>Name</dt><dd>{s.name}</dd>
            <dt>APAAR ID</dt><dd>{s.apaarId}</dd>
            <dt>Institution</dt><dd>{s.institutionCode}</dd>
            <dt>Programme</dt><dd>{s.program}</dd>
            <dt>Academic year</dt><dd>{s.academicYear}</dd>
            <dt>Issued on</dt><dd>{new Date(data.issuedAt).toLocaleDateString()}</dd>
          </dl>
        )}
      </div>
      <p className="foot">APAAR Verify. Personal details are partly hidden to protect privacy.</p>
    </div>
  );
}