import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './store/auth';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import { ForgotPage, ResetPage } from './pages/auth/ForgotResetPages';
import AdminDashboard from './pages/admin/AdminDashboard';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import RoomCalendarPage from './pages/room-calendar/RoomCalendarPage';
import MonthlyCalendarPage from './pages/monthly-calendar/MonthlyCalendarPage';
import BookingsPage from './pages/bookings/BookingsPage';
import CheckInPage from './pages/bookings/CheckInPage';
import CheckOutPage from './pages/bookings/CheckOutPage';
import GuestsPage from './pages/guests/GuestsPage';
import RoomsPage from './pages/rooms/RoomsPage';
import HousekeepingPage from './pages/housekeeping/HousekeepingPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import PaymentsPage from './pages/payments/PaymentsPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/users/UsersPage';
import RolesPage from './pages/users/RolesPage';
import SettingsPage from './pages/settings/SettingsPage';
import AuditPage from './pages/settings/AuditPage';
import ProfilePage from './pages/settings/ProfilePage';
import { Toaster, EmptyState } from './components/common/ui';

export default function App() {
  const user = useAuth((s) => s.user);
  return <>
    <Routes>
      <Route path="/login" element={<LoginPage />} /><Route path="/forgot-password" element={<ForgotPage />} /><Route path="/reset-password" element={<ResetPage />} />
      <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
        <Route index element={<Navigate to={homeFor(user)} replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route element={<ProtectedRoute perm="dashboard.view" />}><Route path="dashboard" element={<AdminDashboard />} /><Route path="reception" element={<ReceptionDashboard />} /></Route>
        <Route element={<ProtectedRoute perm="calendar.view" />}>
          <Route path="room-calendar" element={<RoomCalendarPage />} />
          <Route path="calendar" element={<RoomCalendarPage />} />
          <Route path="monthly-calendar" element={<MonthlyCalendarPage />} />
        </Route>
        <Route element={<ProtectedRoute perm="bookings.view" />}><Route path="bookings" element={<BookingsPage />} /></Route>
        <Route element={<ProtectedRoute perm="checkin.perform" />}><Route path="check-in" element={<CheckInPage />} /></Route>
        <Route element={<ProtectedRoute perm="checkout.perform" />}><Route path="check-out" element={<CheckOutPage />} /></Route>
        <Route element={<ProtectedRoute perm="guests.view" />}><Route path="guests" element={<GuestsPage />} /></Route>
        <Route element={<ProtectedRoute perm="rooms.view" />}><Route path="rooms" element={<RoomsPage />} /></Route>
        <Route element={<ProtectedRoute perm="housekeeping.view" />}><Route path="housekeeping" element={<HousekeepingPage />} /></Route>
        <Route element={<ProtectedRoute perm="maintenance.view" />}><Route path="maintenance" element={<MaintenancePage />} /></Route>
        <Route element={<ProtectedRoute perm="payments.view" />}><Route path="payments" element={<PaymentsPage />} /></Route>
        <Route element={<ProtectedRoute perm="invoices.view" />}><Route path="invoices" element={<InvoicesPage />} /></Route>
        <Route element={<ProtectedRoute perm="reports.view" />}><Route path="reports" element={<ReportsPage />} /></Route>
        <Route element={<ProtectedRoute perm="users.view" />}><Route path="users" element={<UsersPage />} /></Route>
        <Route element={<ProtectedRoute perm="roles.view" />}><Route path="roles" element={<RolesPage />} /></Route>
        <Route element={<ProtectedRoute perm="audit.view" />}><Route path="audit-logs" element={<AuditPage />} /></Route>
        <Route element={<ProtectedRoute perm="settings.manage" />}><Route path="settings" element={<SettingsPage />} /></Route>
        <Route path="*" element={<EmptyState title="Page not found" message="Use the menu to get back on track." />} />
      </Route></Route></Routes><Toaster /></>;
}
