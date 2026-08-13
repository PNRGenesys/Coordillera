import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { Language } from '../lib/translations'

export type UiState = { language: Language }

const initialState: UiState = { language: 'es' }

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload
    },
  },
})

export const { setLanguage } = uiSlice.actions

export function selectLanguage(state: RootState): Language {
  return state.ui.language
}
