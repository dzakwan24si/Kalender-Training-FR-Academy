import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import TrainingCalendar from './pages/TrainingCalendar';
import DataManagement from './pages/DataManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<TrainingCalendar />} />
          <Route path="data" element={<DataManagement />} />
          <Route path="settings" element={<div className="p-6">Settings Page Placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
