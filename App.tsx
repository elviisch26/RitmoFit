import { StatusBar } from 'expo-status-bar';

import { App as RitmoFitApp } from '@/app';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <RitmoFitApp />
    </>
  );
}