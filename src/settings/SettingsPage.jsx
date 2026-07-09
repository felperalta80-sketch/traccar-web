import ModuleMenuLayout from '../common/components/ModuleMenuLayout';
import SettingsMenu from './components/SettingsMenu';

// Página de opciones de Ajustes (flujo: bottom -> esta página -> opción).
const SettingsPage = () => (
  <ModuleMenuLayout title="settingsTitle">
    <SettingsMenu />
  </ModuleMenuLayout>
);

export default SettingsPage;
