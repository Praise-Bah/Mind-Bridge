import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  theme: 'light' | 'dark'
  isMobile: boolean
}

const initialState: UIState = {
  sidebarOpen: true,
  mobileSidebarOpen: false,
  theme: 'light', // Default to light, will be synced by ThemeProvider
  isMobile: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen
    },
    setMobileSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileSidebarOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload
    },
  },
})

export const { toggleSidebar, setSidebarOpen, toggleMobileSidebar, setMobileSidebarOpen, setTheme, setIsMobile } = uiSlice.actions
export default uiSlice.reducer
