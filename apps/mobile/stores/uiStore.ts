import { create } from 'zustand';

interface UiState {
  isCreateSheetOpen: boolean;
  selectedGroupFilter: string | null;

  openCreateSheet: () => void;
  closeCreateSheet: () => void;
  setGroupFilter: (groupId: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCreateSheetOpen: false,
  selectedGroupFilter: null,

  openCreateSheet: () => set({ isCreateSheetOpen: true }),
  closeCreateSheet: () => set({ isCreateSheetOpen: false }),
  setGroupFilter: (groupId) => set({ selectedGroupFilter: groupId }),
}));
