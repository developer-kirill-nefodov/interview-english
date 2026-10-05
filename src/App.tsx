import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Code2, Dumbbell, Layers, MessageSquareText, Mic, Sun, type LucideIcon } from "lucide-react";
import { getStatus } from "./lib/api";
import { dateKey, deckStats } from "./lib/srs";
import { useStore } from "./lib/store";
import { Mission, makePlan, type Plan } from "./mission/Mission";
import { Cards } from "./pages/Cards";
import { Interview } from "./pages/Interview";
import { LiveCoding } from "./pages/LiveCoding";
import { Phrasebook } from "./pages/Phrasebook";
import { Practice } from "./pages/Practice";
import { Progress } from "./pages/Progress";
import { Today } from "./pages/Today";

type Route = "today" | "practice" | "interview" | "coding" | "cards" | "phrases" | "progress";

const NAV: { key: Route; label: string; icon: LucideIcon; group?: string }[] = [
  { key: "today", label: "Today", icon: Sun },
  { key: "practice", label: "Practice", icon: Dumbbell, group: "Practice" },
  { key: "interview", label: "Mock interview", icon: Mic, group: "Practice" },
  { key: "coding", label: "Live coding", icon: Code2, group: "Practice" },
  { key: "cards", label: "Cards", icon: Layers, group: "Learn" },
  { key: "phrases", label: "Phrasebook", icon: BookOpen, group: "Learn" },
  { key: "progress", label: "Progress", icon: BarChart3, group: "Learn" },
];
const TABS: Route[] = ["today", "practice", "cards", "phrases", "progress"];

const readRoute = (): Route => {
  const r = location.hash.replace(/^#\/?/, "");
  return (NAV.some((n) => n.key === r) ? r : "today") as Route;
};

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [ai, setAi] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  // Clicking the link of the page you're on starts it over (e.g. back to the problem list).
  const [visit, setVisit] = useState(0);
  const navClick = () => {
    setPlan(null);
    setVisit((v) => v + 1);
  };
  const state = useStore();
  const due = deckStats(state.cards, dateKey()).due;

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute());
      setPlan(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    getStatus().then((s) => setAi(s.ai));
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (r: string) => {
    location.hash = `/${r}`;
  };
  // A mission gets its own history entry, so the phone's Back button returns to the page you came from.
  const start = (p: Plan) => {
    history.pushState(null, "", "#/mission");
    setPlan(p);
    window.scrollTo(0, 0);
  };
  const exitMission = () => {
    history.replaceState(null, "", "#/today");
    setRoute("today");
    setPlan(null);
    window.scrollTo(0, 0);
  };

  let groupShown = "";
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#/today">
          <span className="brand-mark">
            <MessageSquareText size={18} />
          </span>
          Interview English
        </a>
        {NAV.map((n) => {
          const header = n.group && n.group !== groupShown ? n.group : null;
          if (header) groupShown = header;
          const Icon = n.icon;
          return (
            <div key={n.key}>
              {header && <div className="nav-label">{header}</div>}
              <a href={`#/${n.key}`} onClick={navClick} className={`nav-link ${route === n.key && !plan ? "active" : ""}`}>
                <Icon size={18} /> {n.label}
                {n.key === "cards" && due > 0 && <span className="count">{due}</span>}
              </a>
            </div>
          );
        })}
        <div className="sidebar-foot" title={ai ? "AI feedback is on" : "Set ANTHROPIC_API_KEY on the server to enable AI feedback"}>
          <span className={`dot ${ai ? "on" : ""}`} /> AI interviewer {ai ? "on" : "off"}
        </div>
      </aside>

      <main className="main">
        {plan ? (
          <Mission plan={plan} ai={ai} onExit={exitMission} />
        ) : (
          <div key={visit} className="contents">
            {route === "today" && <Today onStart={start} ai={ai} />}
            {route === "practice" && <Practice go={go} onFormat={(f) => start(makePlan(f))} />}
            {route === "interview" && <Interview ai={ai} />}
            {route === "coding" && <LiveCoding ai={ai} />}
            {route === "cards" && <Cards />}
            {route === "phrases" && <Phrasebook />}
            {route === "progress" && <Progress />}
          </div>
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((k) => {
          const n = NAV.find((x) => x.key === k)!;
          const Icon = n.icon;
          const active = !plan && (route === k || (k === "practice" && (route === "interview" || route === "coding")));
          return (
            <a key={k} href={`#/${k}`} onClick={navClick} className={active ? "active" : ""}>
              <Icon size={20} />
              {k === "phrases" ? "Phrases" : n.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
