import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle2, AlertTriangle, Info, Zap, Check } from 'lucide-react';
import { Notification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onNotificationClick: (link?: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onNotificationClick
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md h-full bg-brand-dark/95 border-l border-slate-800 glass-panel p-6 shadow-2xl flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-emerald/20 flex items-center justify-center text-brand-mint">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Notifications Center</h3>
                <p className="text-xs text-slate-400">
                  {notifications.filter(n => !n.read).length} unread updates
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => {
                const isAction = notif.type === 'action';
                const isSuccess = notif.type === 'success';
                const isWarning = notif.type === 'warning';

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) onMarkRead(notif.id);
                      if (notif.link) onNotificationClick(notif.link);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      notif.read
                        ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                        : 'bg-slate-900/90 border-brand-emerald/30 shadow-lg text-slate-200 hover:border-brand-emerald'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-400'
                            : isAction
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : isWarning ? <AlertTriangle className="w-4 h-4" /> : isAction ? <Zap className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-brand-emerald shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-2">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Real-time WebSocket alerts powered by FoodRescue
          </p>
        </div>
      </motion.div>
    </div>
  );
};
