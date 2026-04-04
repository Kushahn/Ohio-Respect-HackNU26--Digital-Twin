import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { useTelemetry } from "./contexts/TelemetryContext";
import CabinView from "./pages/CabinView";
import DispatcherView from "./pages/DispatcherView";

function AppRoutes() {
  const { isConnected, isReconnecting } = useTelemetry();

  return (
    <AppLayout isConnected={isConnected} isReconnecting={isReconnecting}>
      <Routes>
        <Route path="/" element={<Navigate to="/cab" replace />} />
        <Route path="/cab" element={<CabinView />} />
        <Route path="/dispatch" element={<DispatcherView />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return <AppRoutes />;
}
