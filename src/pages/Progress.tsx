import { useState } from "react";
import { clearHistory, loadHistory } from "../lib/storage";
import { resetAll } from "../lib/store";
import { fmtTime } from "../components";

export function Progress() {
  const [history, setHistory] = useState(loadHistory);
  const totalSec = history.reduce((s, h) => s + h.durationSec, 0);
  const days = new Set(history.map((h) => new Date(h.date).toDateString())).size;

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">Learn</span>
        <h1>Progress</h1>
      </div>
      <section className="card">
        <div className="row">
          <div className="score">
            <b>{history.length}</b>
            <small>sessions</small>
          </div>
          <div className="score">
            <b>{days}</b>
            <small>active days</small>
          </div>
          <div className="score">
            <b>{fmtTime(totalSec)}</b>
            <small>practice time</small>
          </div>
        </div>
      </section>
      {history.length === 0 ? (
        <p className="muted">No sessions yet. Start a mock interview or a live coding problem.</p>
      ) : (
        <section className="card">
          <table className="history">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Session</th>
                <th>Time</th>
                <th>Scores</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.date).toLocaleDateString()}</td>
                  <td>{h.kind === "coding" ? "Coding" : "Interview"}</td>
                  <td>{h.title}</td>
                  <td>{fmtTime(h.durationSec)}</td>
                  <td>
                    {Object.entries(h.scores)
                      .map(([k, v]) => `${k} ${v}`)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <details style={{ marginTop: 24 }}>
            <summary className="faint small">Danger zone</summary>
            <button
              className="btn ghost small"
              onClick={() => {
                if (confirm("Delete all history, cards, stories and progress? This can't be undone.")) {
                  clearHistory();
                  resetAll();
                  setHistory([]);
                }
              }}
            >
              Reset all progress
            </button>
          </details>
        </section>
      )}
    </div>
  );
}
