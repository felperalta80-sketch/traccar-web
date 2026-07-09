import ModuleMenuLayout from '../common/components/ModuleMenuLayout';
import ReportsMenu from './components/ReportsMenu';

// Página de opciones de Reportes (flujo: bottom -> esta página -> reporte).
const ReportsPage = () => (
  <ModuleMenuLayout title="reportTitle">
    <ReportsMenu />
  </ModuleMenuLayout>
);

export default ReportsPage;
