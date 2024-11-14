import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SwapInterface } from "./components/swap-interface";
import "./App.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomeLogo from "./components/HomeLogo";
import Status from './pages/Status';
import SimulationPage from './pages/SimulationPage';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div  className="app-container">
        <Routes>
        <Route path="/" element={<Home key="home" />} />
          <Route path="/swap" element={<SwapInterface key="swap" />} />
          <Route path="/status" element={<Status key="status" />} />
          <Route path="/sims" element={<SimulationPage key="sims" />} />
        </Routes>
        <ToastContainer position="bottom-right" autoClose={5000} />
      </div>
    </Router>
  );
}

export default App;
