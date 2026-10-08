import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, addMonths } from 'date-fns';
import { bookingApi } from '../../services/booking.api';
import { useUI } from '../../store/ui';
import { useCan } from '../../store/auth';
import { useMutate } from '../../hooks/useMutate';
import { iso, today, addDays } from '../../utils/format';

import MonthlyCalendarSidebar from '../../components/monthly-calendar/MonthlyCalendarSidebar';
import MonthlyCalendarContent from '../../components/monthly-calendar/MonthlyCalendarContent';
import MonthlyArrivalsView from '../../components/monthly-calendar/MonthlyArrivalsView';
import MonthlyDeparturesView from '../../components/monthly-calendar/MonthlyDeparturesView';
import MonthlyRoomStatusView from '../../components/monthly-calendar/MonthlyRoomStatusView';
import DateDetailsModal from '../../components/monthly-calendar/DateDetailsModal';
import { Skeleton, ErrorState } from '../../components/common/ui';

export default function MonthlyCalendarPage() {
  const can = useCan();
  const { openBooking, openWizard } = useUI();

  // Navigation & View state
  const [activeView, setActiveView] = useState('calendar'); // 'calendar' | 'arrivals' | 'departures' | 'room_status' | 'exceptions'
  const [currentMonth, setCurrentMonth] = useState(today());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);

  // Month range for backend API
  const fromDate = startOfMonth(currentMonth);
  const toDate = startOfMonth(addMonths(currentMonth, 1));

  const params = {
    from: iso(fromDate),
    to: iso(toDate)
  };

  // Real data query from MongoDB backend
  const { data: calendarData, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['monthly-calendar', params],
    queryFn: () => bookingApi.calendar(params),
    placeholderData: (p) => p,
    refetchInterval: 60000
  });

  // Mutators for check-in and check-out
  const checkInMutate = useMutate((id) => bookingApi.checkIn(id), {
    success: 'Guest checked in successfully',
    invalidate: ['monthly-calendar', 'calendar', 'bookings', 'dashboard']
  });

  const checkOutMutate = useMutate(({ id, body }) => bookingApi.checkOut(id, body), {
    success: 'Guest checked out successfully',
    invalidate: ['monthly-calendar', 'calendar', 'bookings', 'dashboard']
  });

  // Calculate live counts for the sidebar from real DB data
  const counts = useMemo(() => {
    const rooms = calendarData?.rooms || [];
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

    let arrivalsCount = 0;
    let departuresCount = 0;
    let exceptionsCount = 0;

    rooms.forEach((room) => {
      const activeBlocks = (room.blocks || []).length;
      if (activeBlocks > 0 || room.status === 'maintenance' || room.status === 'out_of_service' || (room.tempConfig?.active && !room.tempConfig?.isAC)) {
        exceptionsCount++;
      }

      (room.bookings || []).forEach((b) => {
        const inDate = new Date(b.checkInDate).toISOString().split('T')[0];
        const outDate = new Date(b.checkOutDate).toISOString().split('T')[0];

        if (inDate.startsWith(monthStr)) {
          arrivalsCount++;
        }
        if (outDate.startsWith(monthStr)) {
          departuresCount++;
        }
      });
    });

    return {
      arrivals: arrivalsCount,
      departures: departuresCount,
      exceptions: exceptionsCount,
      rooms: rooms.length
    };
  }, [calendarData, currentMonth]);

  const handleDateClick = (date, dayStats) => {
    setSelectedDateDetails({ date, dayStats });
  };

  const handleViewChange = (v) => {
    setActiveView(v);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-3 sm:-m-4 lg:-m-6 overflow-hidden bg-slate-50">

      {/* Dedicated Monthly Calendar Aside Bar */}
      <MonthlyCalendarSidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        counts={counts}
        onNewBooking={() => can('bookings.create') && openWizard({ checkIn: iso(today()), checkOut: iso(addDays(today(), 1)) })}
        onCheckIn={() => handleViewChange('arrivals')}
        onCheckOut={() => handleViewChange('departures')}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Monthly Calendar Content Area */}
      <main className={`flex-1 p-2 sm:p-3 lg:p-4 bg-slate-50/50 flex flex-col h-full min-h-0 w-full overflow-y-auto lg:overflow-hidden`}>
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-[480px] w-full rounded-2xl" />
          </div>
        ) : isError && !calendarData ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="card max-w-md w-full">
              <ErrorState error={error} onRetry={() => refetch()} />
            </div>
          </div>
        ) : (
          <>
            {activeView === 'calendar' && (
              <MonthlyCalendarContent
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                calendarData={calendarData}
                isLoading={isLoading}
                isFetching={isFetching}
                onRefetch={refetch}
                onDateClick={handleDateClick}
                onNewBooking={() => can('bookings.create') && openWizard({ checkIn: iso(today()), checkOut: iso(addDays(today(), 1)) })}
                onOpenMobileMenu={() => setMobileSidebarOpen(true)}
              />
            )}

            {activeView === 'arrivals' && (
              <MonthlyArrivalsView
                calendarData={calendarData}
                currentMonth={currentMonth}
                onOpenBooking={(id) => openBooking(id)}
                onNewBooking={() => can('bookings.create') && openWizard()}
                onCheckInAction={(id) => checkInMutate.mutate(id)}
              />
            )}

            {activeView === 'departures' && (
              <MonthlyDeparturesView
                calendarData={calendarData}
                currentMonth={currentMonth}
                onOpenBooking={(id) => openBooking(id)}
                onNewBooking={() => can('bookings.create') && openWizard()}
                onCheckOutAction={(id) => checkOutMutate.mutate({ id })}
              />
            )}

            {activeView === 'room_status' && (
              <MonthlyRoomStatusView
                calendarData={calendarData}
                onOpenBooking={(id) => openBooking(id)}
              />
            )}
          </>
        )}
      </main>

      {/* Date Details Modal */}
      {selectedDateDetails && (
        <DateDetailsModal
          date={selectedDateDetails.date}
          dayStats={selectedDateDetails.dayStats}
          rooms={calendarData?.rooms || []}
          onClose={() => setSelectedDateDetails(null)}
          onOpenBooking={(id) => openBooking(id)}
          onNewBooking={(dateStr) => {
            if (can('bookings.create')) {
              openWizard({
                checkIn: dateStr,
                checkOut: iso(addDays(new Date(dateStr), 1))
              });
            }
          }}
        />
      )}

    </div>
  );
}
