import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { FieldsPage } from './pages/FieldsPage';
import { MyFieldsPage } from './pages/MyFieldsPage';
import { FieldDetailPage } from './pages/FieldDetailPage';
import { AgentsPage } from './pages/AgentsPage';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/LoadingSpinner';

type Page =
  | 'dashboard'
  | 'fields'
  | 'my-fields'
  | 'agents'
  | 'field-detail';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  function navigate(target: string, fieldId?: string) {
    setPage(target as Page);
    if (fieldId) setSelectedFieldId(fieldId);
  }

  function handleLoginSuccess(u: any) {
    setUser(u);
    setPage('dashboard');
  }

  function handleLogout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    setUser(null);
    setPage('dashboard');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === 'admin';

  function renderPage() {
    if (page === 'field-detail' && selectedFieldId) {
      return (
        <FieldDetailPage
          fieldId={selectedFieldId}
          onBack={() => setPage(isAdmin ? 'fields' : 'my-fields')}
        />
      );
    }

    if (isAdmin) {
      switch (page) {
        case 'fields':
          return <FieldsPage onNavigate={navigate} />;
        case 'agents':
          return <AgentsPage />;
        default:
          return <AdminDashboard onNavigate={navigate} />;
      }
    } else {
      switch (page) {
        case 'my-fields':
          return <MyFieldsPage onNavigate={navigate} />;
        default:
          // Pass onLogout down so AgentDashboard's sign-out button works
          return <AgentDashboard onNavigate={navigate} onLogout={handleLogout} />;
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        user={user}
        currentPage={page}
        onNavigate={(target) => setPage(target as Page)}
        onLogout={handleLogout}
      />
      <main>{renderPage()}</main>
    </div>
  );
}
