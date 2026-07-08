import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import { map } from '../core/MapView';
import { useTranslation } from '../../common/components/LocalizationProvider';

const useStyles = makeStyles()(() => ({
  button: {
    '&&': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#333',
    },
    '&.active': {
      backgroundColor: '#e6e6e6',
      borderRadius: 'inherit',
    },
  },
}));

const MapLabels = ({ enabled, onToggle }) => {
  const theme = useTheme();
  const t = useTranslation();
  const { classes } = useStyles();

  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const buttonRef = useRef();
  const rootRef = useRef();

  useEffect(() => {
    let container;
    const control = {
      onAdd: () => {
        container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        const button = document.createElement('button');
        button.type = 'button';
        button.title = t('sharedShowNames');
        button.className = `maplibregl-ctrl-icon ${classes.button}`;
        button.classList.toggle('active', enabledRef.current);
        button.onclick = () => onToggleRef.current();
        container.appendChild(button);
        buttonRef.current = button;
        rootRef.current = createRoot(button);
        rootRef.current.render(<LabelIcon fontSize="small" />);
        return container;
      },
      onRemove: () => {
        queueMicrotask(() => rootRef.current.unmount());
        container.remove();
      },
    };
    map.addControl(control, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => map.removeControl(control);
  }, [theme.direction, t, classes.button]);

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.classList.toggle('active', enabled);
    }
    if (rootRef.current) {
      rootRef.current.render(
        enabled ? <LabelIcon fontSize="small" /> : <LabelOffIcon fontSize="small" />,
      );
    }
  }, [enabled]);

  return null;
};

export default MapLabels;
