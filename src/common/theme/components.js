export default {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    },
  },
  // Inputs estilo Ubimax: relleno tenue, esquinas redondeadas y borde
  // transparente que se resalta al enfocar (igual que el buscador/filtros).
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        backgroundColor: theme.palette.action.hover,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.divider,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: '1px',
        },
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        textTransform: 'none',
      },
      sizeMedium: {
        height: '40px',
      },
    },
  },
  // Superficies/"grupos": tarjetas, menús y popovers redondeados.
  MuiPaper: {
    styleOverrides: {
      rounded: {
        borderRadius: 9,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
      },
    },
  },
  // Tarjetas: mismo redondeo Ubimax que Paper.
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 9,
      },
    },
  },
  // Acordeones redondeados y separados entre sí (sin la línea divisoria
  // superior por defecto). El margen uniforme deja aire entre secciones,
  // tanto colapsadas como expandidas.
  MuiAccordion: {
    defaultProps: {
      // Look plano tipo tarjeta: borde en vez de sombra.
      elevation: 0,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        marginBottom: theme.spacing(1),
        border: `1px solid ${theme.palette.divider}`,
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: 0,
          marginBottom: theme.spacing(1),
        },
      }),
    },
  },
  // Tooltip con radio Ubimax (el default MUI es ~4px).
  MuiTooltip: {
    defaultProps: {
      enterDelay: 500,
      enterNextDelay: 500,
    },
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
      },
    },
  },
  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'center',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        '@media print': {
          color: theme.palette.alwaysDark.main,
        },
      }),
    },
  },
};
