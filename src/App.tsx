import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SwapInterface } from "./components/swap-interface";
import "./App.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomeLogo from "./components/HomeLogo";
import Status from './pages/Status';

function App() {
  return (
    <Router>
      <div  className="app-container text-white">
        <Routes>
          <Route path="/" element={<HomeLogo />} />
          <Route path="/swap" element={<SwapInterface />} />
          <Route path="/status" element={<Status />} />
        </Routes>
        <ToastContainer position="bottom-right" autoClose={5000} />
      </div>
    </Router>
  );
}

export default App;
