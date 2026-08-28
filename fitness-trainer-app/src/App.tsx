import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";

function App() {
  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="brand">🏋️ Moj Trener</div>
        <NavLink to="/" end className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          Tjedni pregled
        </NavLink>
        <NavLink to="/klijenti" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          Klijenti
        </NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/klijenti" element={<Clients />} />
          <Route path="/klijenti/:id" element={<ClientDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
