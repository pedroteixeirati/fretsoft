import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import PlatformTenants from '../../pages/PlatformTenants';
import TenantProfile from '../../pages/TenantProfile';
import Revenues from '../../pages/Revenues';
import Payables from '../../pages/Payables';
import Expenses from '../../pages/Expenses';
import Vehicles from '../../pages/Vehicles';
import Reports from '../../pages/Reports';
import Suppliers from '../../pages/Suppliers';
import Companies from '../../pages/Companies';
import Contracts from '../../pages/Contracts';
import Cargas from '../../pages/Cargas';
import Freights from '../../pages/Freights';
import NovalogOperations from '../../pages/NovalogOperations';
import Settings from '../../pages/Settings';
import Support from '../../pages/Support';
import LoginPage from '../../features/auth/pages/LoginPage';
import AccessPendingPage from '../../features/auth/pages/AccessPendingPage';
import PrivateLayout from '../layouts/PrivateLayout';
import PublicLayout from '../layouts/PublicLayout';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import { getPathFromNavItem } from './navigation';

function DashboardRoute() {
  const navigate = useNavigate();
  return <Dashboard onNavigate={(item) => navigate(getPathFromNavItem(item))} />;
}

function ExpensesRoute() {
  const navigate = useNavigate();
  return <Expenses onNavigate={(item) => navigate(getPathFromNavItem(item))} />;
}

function PayablesRoute() {
  const navigate = useNavigate();
  return <Payables onNavigate={(item) => navigate(getPathFromNavItem(item))} />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/acesso-pendente" element={<AccessPendingPage />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<PrivateLayout />}>
            <Route path="/" element={<DashboardRoute />} />
            <Route path="/transportadoras" element={<PlatformTenants />} />
            <Route path="/transportadora" element={<TenantProfile />} />
            <Route path="/contas-a-receber" element={<Revenues />} />
            <Route path="/contas-a-pagar" element={<PayablesRoute />} />
            <Route path="/custos-operacionais" element={<ExpensesRoute />} />
            <Route path="/veiculos" element={<Vehicles />} />
            <Route path="/fornecedores" element={<Suppliers />} />
            <Route path="/empresas" element={<Companies />} />
            <Route path="/contratos" element={<Contracts />} />
            <Route path="/fretes" element={<Freights />} />
            <Route path="/novalog/lancamentos" element={<NovalogOperations />} />
            <Route path="/cargas" element={<Cargas />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/suporte" element={<Support />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
