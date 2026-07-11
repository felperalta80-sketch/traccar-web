import { makeStyles } from 'tss-react/mui';
import logoHorizontal from '../resources/images/logo-horizontal.svg';

// Fondo plano (#F0F0F0, off-white) sin la franja de color; el formulario va
// centrado con el logo arriba de las credenciales.
const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: theme.spacing(3),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: theme.spacing(46),
    padding: theme.spacing(3),
  },
  logo: {
    alignSelf: 'center',
    width: '62%',
    maxWidth: 230,
    height: 'auto',
    marginBottom: theme.spacing(4),
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();

  return (
    <main className={classes.root}>
      <form className={classes.form}>
        <img src={logoHorizontal} alt="" className={classes.logo} />
        {children}
      </form>
    </main>
  );
};

export default LoginLayout;
