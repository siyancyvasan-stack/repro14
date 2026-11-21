import React from 'react';
import { publicApiRequest } from '../../services/apiClient';

export const AppVersion: React.FC<{ className?: string; portal?: string }> = ({
  className = '',
  portal = 'manager',
}) => {
  const [runtimeVersion, setRuntimeVersion] = React.useState('');

  React.useEffect(() => {
    let active = true;
    void publicApiRequest<{
      version?: string;
      manager?: { version?: string };
      factory?: { version?: string };
      sales?: { version?: string };
    }>('/api/v1/config/app-version')
      .then((config) => {
        if (!active) return;
        const ver =
          (portal === 'manager'
            ? config.manager?.version
            : portal === 'factory'
            ? config.factory?.version
            : config.sales?.version) ||
          config.version ||
          '';
        if (ver) setRuntimeVersion(ver.trim());
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [portal]);

  const portalVersion =
    portal === 'manager'
      ? import.meta.env.VITE_MANAGER_APP_VERSION
      : portal === 'factory'
      ? import.meta.env.VITE_FACTORY_APP_VERSION
      : portal === 'sales'
      ? import.meta.env.VITE_SALES_APP_VERSION
      : '';

  const raw =
    runtimeVersion ||
    portalVersion ||
    import.meta.env.VITE_APP_VERSION ||
    import.meta.env.APP_VERSION ||
    '14';

  const versionNumber =
    typeof raw === 'string'
      ? raw.trim().replace(/^[vV]/, '')
      : String(raw || '14').trim().replace(/^[vV]/, '');

  return (
    <span className={`inline-block font-bold tracking-tight ${className}`}>
      Version - {versionNumber || '14'}
    </span>
  );
};
