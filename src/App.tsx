import { useState } from 'react';
import Layout from './components/Layout';
import DbSetup from './components/DbSetup';
import PasswordGuard from './components/PasswordGuard';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import RoomPlan from './pages/RoomPlan';
import RoomInventory from './pages/RoomInventory';
import HousingCertificate from './pages/HousingCertificate';
import ClearanceCertificate from './pages/ClearanceCertificate';
import ImportData from './pages/ImportData';
import QuickSearch from './pages/QuickSearch';
import AddStudent from './pages/AddStudent';
<<<<<<< HEAD

type Page = 'dashboard' | 'students' | 'plan' | 'housing-cert' | 'clearance-cert' | 'import' | 'search' | 'inventory' | 'add-student';
=======
import Registration from './pages/Registration';

type Page =
  | 'dashboard'
  | 'students'
  | 'plan'
  | 'housing-cert'
  | 'clearance-cert'
  | 'import'
  | 'search'
  | 'inventory'
  | 'add-student'
  | 'registration';
>>>>>>> c191818 (update: fix 1000 limit and dashboard improvements)

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [dbReady, setDbReady] = useState(false);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard />;
      case 'students':       return <Students />;
      case 'plan':           return <RoomPlan />;
      case 'inventory':      return <RoomInventory />;
      case 'housing-cert':   return <HousingCertificate />;
      case 'clearance-cert': return <ClearanceCertificate />;
      case 'import':         return <ImportData />;
      case 'search':         return <QuickSearch />;
      case 'add-student':    return <AddStudent />;
<<<<<<< HEAD
=======
      case 'registration':   return <Registration />;
>>>>>>> c191818 (update: fix 1000 limit and dashboard improvements)
      default:               return <Dashboard />;
    }
  };

  return (
    <PasswordGuard>
      {!dbReady ? (
        <DbSetup onReady={() => setDbReady(true)} />
      ) : (
        <Layout currentPage={page} onNavigate={p => setPage(p as Page)}>
          {renderPage()}
        </Layout>
      )}
    </PasswordGuard>
  );
}
