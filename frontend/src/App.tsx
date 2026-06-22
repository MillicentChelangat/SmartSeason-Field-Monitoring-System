import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { FieldsPage } from './pages/FieldsPage';
import { MyFieldsPage } from './pages/MyFieldsPage';
import { FieldDetailPage } from './pages/FieldDetailPage';
import { AgentsPage } from './pages/AgentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { IssuesPage } from './pages/IssuesPage';
import { getOpenIssuesCount } from './api/api'

type Page =
  | 'dashboard' | 'fields' | 'my-fields' | 'agents'
  | 'field-detail' | 'analytics' | 'reports' | 'settings' | 'notifications' | 'issues';

export default function App() {
  const [user, setUser]                       = useState<any>(null);
  const [page, setPage]                       = useState<Page>('dashboard');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [refreshKey, setRefreshKey]           = useState(0);
  const [openIssuesCount, setOpenIssuesCount] = useState(0);

useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem('user'); }
    }
    setLoading(false);
  }, []);

useEffect(() => {
  if (user?.role === 'admin') {
    getOpenIssuesCount()
      .then(res => setOpenIssuesCount(res.data.open_issues))
      .catch(() => {});
  }
}, [user, refreshKey]);


  function navigate(target: string, fieldId?: string) {
    setPage(target as Page);
    if (fieldId) { setSelectedFieldId(fieldId); }
    else { setRefreshKey(prev => prev + 1); }
  }

  function handleLoginSuccess(u: any) { setUser(u); setPage('dashboard'); }

  function handleLogout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    setUser(null);
    setPage('dashboard');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef0eb] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return <LoginPage onLoginSuccess={handleLoginSuccess} />;

  const isAdmin    = user.role === 'admin';
  const sharedProps = { onNavigate: navigate, onLogout: handleLogout, user, openIssuesCount };

  function renderPage() {
    if (page === 'field-detail' && selectedFieldId) {
      return (
        <FieldDetailPage
          fieldId={selectedFieldId}
          onBack={() => navigate(isAdmin ? 'fields' : 'my-fields')}
          {...sharedProps}
        />
      );
    }

if (page === 'notifications') {
    return <NotificationsPage key={refreshKey} {...sharedProps} />;
  }
    
    if (isAdmin) {
        switch (page) {
          case 'fields':    return <FieldsPage    key={refreshKey} {...sharedProps} />;
          case 'agents':    return <AgentsPage    key={refreshKey} {...sharedProps} />;
          case 'analytics': return <AnalyticsPage key={refreshKey} {...sharedProps} />;
          case 'reports':   return <ReportsPage   key={refreshKey} {...sharedProps} />;
          case 'settings':  return <SettingsPage  key={refreshKey} {...sharedProps} />;
          case 'issues':    return <IssuesPage    key={refreshKey} {...sharedProps} />;
          default:          return <AdminDashboard key={refreshKey} {...sharedProps} />;
        }
      
    } 
    // Agent pages
    switch (page) {
      case 'my-fields': return <MyFieldsPage key={refreshKey} {...sharedProps} />;
      case 'analytics': return <AnalyticsPage key={refreshKey} {...sharedProps} />;
      case 'settings':  return <SettingsPage key={refreshKey} {...sharedProps} />;
      default:          return <AgentDashboard key={refreshKey} {...sharedProps} />;
    }
  }

  return <>{renderPage()}</>;
}
