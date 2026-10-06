import React from 'react';
import {
  Calendar as CalendarIcon,
  LogIn,
  LogOut,
  BedDouble,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cx } from '../common/ui';

export default function MonthlyCalendarSidebar({
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapse,
  counts = { arrivals: 0, departures: 0, exceptions: 0, rooms: 0 },
  onNewBooking,
  onCheckIn,
  onCheckOut,
  mobileOpen = false,
  onCloseMobile = () => {}
}) {
  const navSections = [
    {
      title: 'CALENDAR',
      items: [
        {
          id: 'calendar',
          label: 'Monthly View',
          icon: CalendarIcon,
          badge: null
        }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          id: 'arrivals',
          label: 'Arrivals',
          icon: LogIn,
          iconColor: 'text-emerald-500',
          dot: 'bg-emerald-500',
          badge: counts.arrivals,
          badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        },
        {
          id: 'departures',
          label: 'Departures',
          icon: LogOut,
          iconColor: 'text-rose-500',
          dot: 'bg-rose-500',
          badge: counts.departures,
          badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200'
        }
      ]
    },
    {
      title: 'ROOM',
      items: [
        {
          id: 'room_status',
          label: 'Room Status',
          icon: BedDouble,
          iconColor: 'text-blue-500',
          badge: counts.rooms ? `${counts.rooms}` : null,
          badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200'
        }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Sidebar Header */}
      <div className={cx(
        'flex items-center border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-sm shrink-0',
        collapsed ? 'justify-center p-3 h-16' : 'justify-between px-4 py-3.5 h-16'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase truncate">
                Monthly Calendar
              </h2>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                Monthly Operations
              </p>
            </div>
          </div>
        ) : (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30">
            <CalendarIcon className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand calendar sidebar' : 'Collapse calendar sidebar'}
          aria-label={collapsed ? 'Expand calendar sidebar' : 'Collapse calendar sidebar'}
          className={cx(
            'hidden lg:flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors',
            collapsed && 'mt-2'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Close monthly menu"
        >
          ✕
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <p className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeView === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={cx(
                      'group relative flex w-full items-center rounded-lg transition-all duration-150 text-left',
                      collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2 text-xs font-semibold',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
                    )}
                  >
                    <div className="relative flex items-center justify-center">
                      <IconComponent className={cx(
                        'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                        isActive ? 'text-white' : (item.iconColor || 'text-slate-600')
                      )} />
                      {item.dot && !isActive && (
                        <span className={cx('absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-white', item.dot)} />
                      )}
                    </div>

                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== null && item.badge !== undefined && (
                          <span
                            className={cx(
                              'inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-md min-w-[20px]',
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor || 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}

                    {collapsed && item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Divider */}
        <hr className="border-slate-200/80 my-2" />

        {/* Quick Actions */}
        <div className="space-y-1.5">
          {!collapsed && (
            <p className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              QUICK ACTIONS
            </p>
          )}

          <button
            onClick={onNewBooking}
            title={collapsed ? 'New Booking' : undefined}
            className={cx(
              'group flex w-full items-center rounded-lg transition-all text-left bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-sm shadow-blue-500/20',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2 text-xs'
            )}
          >
            <Plus className="h-4 w-4 shrink-0 transition-transform group-hover:rotate-90" />
            {!collapsed && <span className="truncate">+ New Booking</span>}
          </button>

          <button
            onClick={onCheckIn}
            title={collapsed ? 'Quick Check-in' : undefined}
            className={cx(
              'group flex w-full items-center rounded-lg border border-slate-200/90 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all text-left font-medium',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-1.5 text-xs'
            )}
          >
            <LogIn className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            {!collapsed && <span className="truncate">Check-in</span>}
          </button>

          <button
            onClick={onCheckOut}
            title={collapsed ? 'Quick Check-out' : undefined}
            className={cx(
              'group flex w-full items-center rounded-lg border border-slate-200/90 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all text-left font-medium',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-1.5 text-xs'
            )}
          >
            <LogOut className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            {!collapsed && <span className="truncate">Check-out</span>}
          </button>
        </div>
      </div>

      {/* Footer System Status */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate">Live PMS Database Sync</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Aside (>= lg) */}
      <aside
        className={cx(
          'hidden lg:flex flex-col shrink-0 bg-white border-r border-slate-200/80 transition-all duration-300 select-none shadow-[2px_0_12px_-4px_rgba(0,0,0,0.04)] z-10 h-full min-h-0',
          collapsed ? 'w-16' : 'w-[260px]'
        )}
        aria-label="Monthly Calendar Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (< lg) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Slide-out Drawer */}
          <div className="relative flex flex-col w-[85vw] max-w-[300px] h-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
