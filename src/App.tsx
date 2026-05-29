import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ThemeSync from './components/ThemeSync';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import StatsInsights from './pages/StatsInsights';
import AddTransactionSheetRoute from './pages/AddTransactionSheetRoute';
import Settings from './pages/Settings';
import ExtractionRulesSettings from './pages/ExtractionRulesSettings';
import RecurringRulesSettings from './pages/RecurringRulesSettings';
import CsvToolsSettings from './pages/CsvToolsSettings';
import BackupRestoreSettings from './pages/BackupRestoreSettings';
import NativeDeepLinks from './components/NativeDeepLinks';
import { useNativeBackButton } from './hooks/useNativeBackButton';
import { getRouterBasename } from './lib/router';

function AppRoutes() {
  useNativeBackButton();

  return (
    <>
      <NativeDeepLinks />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/:id" element={<TransactionDetail />} />
          <Route path="stats" element={<StatsInsights />} />
          <Route path="add" element={<AddTransactionSheetRoute />} />
          <Route path="add-expense" element={<AddTransactionSheetRoute />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/extraction-rules" element={<ExtractionRulesSettings />} />
          <Route path="settings/recurring" element={<RecurringRulesSettings />} />
          <Route path="settings/csv" element={<CsvToolsSettings />} />
          <Route path="settings/backup" element={<BackupRestoreSettings />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter basename={getRouterBasename()}>
      <ThemeSync />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
