import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import BookingWizard from '../components/booking/BookingWizard';
import BookingDrawer from '../components/booking/BookingDrawer';

export default function AppLayout() {
  return <div className="flex h-screen overflow-hidden"><Sidebar />
    <div className="flex min-w-0 flex-1 flex-col"><Topbar /><main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main></div>
    <BookingWizard /><BookingDrawer /></div>;
}
