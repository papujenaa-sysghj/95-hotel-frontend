import { create } from 'zustand';
let id = 0;
export const useToast = create((set) => ({
  items: [],
  push: (type, message) => { const t = { id: ++id, type, message }; set((s) => ({ items: [...s.items, t] })); setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== t.id) })), 4500); },
  dismiss: (i) => set((s) => ({ items: s.items.filter((x) => x.id !== i) })),
}));
export const toast = { success: (m) => useToast.getState().push('success', m), error: (m) => useToast.getState().push('error', m) };
