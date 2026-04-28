import Header from "./components/Header";
import PlayerForm from "./components/PlayerForm";
import PlayerTable from "./components/PlayerTable";
import ActivePlayerPanel from "./components/ActivePlayerPanel";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-3 space-y-3">
      <Header />
      <div className="flex gap-3 items-start">
        <div className="w-52 shrink-0">
          <PlayerForm />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <PlayerTable />
        </div>
        <div className="w-[420px] shrink-0">
          <ActivePlayerPanel />
        </div>
      </div>
    </div>
  );
}
