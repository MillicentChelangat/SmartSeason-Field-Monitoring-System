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
  const [refreshKey, setRefreshKey] = useState(0); 

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
    if (fieldId) {
      setSelectedFieldId(fieldId);
    } else {
      setRefreshKey(prev => prev + 1);  
    }
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
          onBack={() => navigate(isAdmin ? 'fields' : 'my-fields')} 
        />
      );
    }

    if (isAdmin) {
      switch (page) {
        case 'fields':
          return <FieldsPage key={refreshKey} onNavigate={navigate} />;
        case 'agents':
          return <AgentsPage key={refreshKey} />;
        default:
          return <AdminDashboard key={refreshKey} onNavigate={navigate} />;
      }
    } else {
      switch (page) {
        case 'my-fields':
          return <MyFieldsPage key={refreshKey} onNavigate={navigate} />;
        default:
          return <AgentDashboard key={refreshKey} onNavigate={navigate} onLogout={handleLogout} />;
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        user={user}
        currentPage={page}
        onNavigate={(target) => navigate(target)}  
        onLogout={handleLogout}
      />
      <main>{renderPage()}</main>
    </div>
  );
}