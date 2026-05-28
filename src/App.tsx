import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import StatsInsights from './pages/StatsInsights';
import AddTransactionSheetRoute from './pages/AddTransactionSheetRoute';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="stats" element={<StatsInsights />} />
          <Route path="add" element={<AddTransactionSheetRoute />} />
          <Route path="add-expense" element={<AddTransactionSheetRoute />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
