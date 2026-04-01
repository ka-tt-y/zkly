import { Navigate, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProofCatalog from './pages/ProofCatalog';
import Prove from './pages/Prove';
import Proof from './pages/Proof';
import Verify from './pages/Verify';
import StorachaLibrary from './pages/StorachaLibrary';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-gray-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Navigate to="/proofs" replace />} />
        <Route path="/proofs" element={<Dashboard />} />
        <Route path="/proofs/:id" element={<Proof />} />
        <Route path="/storacha" element={<StorachaLibrary />} />
        <Route path="/prove" element={<ProofCatalog />} />
        <Route path="/prove/:type" element={<Prove />} />
        <Route path="/proof" element={<Proof />} />
        <Route path="/proof/:id" element={<Proof />} />
        <Route path="/p/shared/:id" element={<Proof />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/verify/public/:id" element={<Proof />} />
        <Route path="/share/:id" element={<Proof />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
