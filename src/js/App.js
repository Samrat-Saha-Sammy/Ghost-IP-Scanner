import React, { useState } from "react";
const netList = require("network-list");
const os = require("os");
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import {
  createMuiTheme,
  withStyles,
  makeStyles,
  ThemeProvider,
  MuiThemeProvider,
} from "@material-ui/core/styles";

export default function App() {
  const classes = useStyles();
  // Application Gloabal Variables
  let _activeIP = null;

  const [aliveIpList, setAliveIpList] = useState([]);

  const getHostIP = () => {
    const nets = os.networkInterfaces();
    const ipList = [];

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === "IPv4" && !net.internal) {
          ipList.push(net.address);
        }
      }
    }
    return ipList;
  };

  const scanNetwork = () => {
    const hostIpArr = getHostIP();

    if (hostIpArr.length < 1) {
      //logError(true, "#GIPS 05: Host IP unknown.");
      return false;
    }

    // Select 1st Index of IP list
    _activeIP = hostIpArr[0];
    //
    const exludeLastOctet = _activeIP.split(".").slice(0, -1).join(".");

    netList.scanEach({ ip: exludeLastOctet, vendor: true }, (err, obj) => {
      if (obj.alive) {
        setAliveIpList((aliveIpList) => [...aliveIpList, obj]);
        console.log(aliveIpList);
      }
    });
  };

  return (
    <MuiThemeProvider theme={theme}>
      <Container fixed>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="center"
              className={classes.sectionHead}
            >
              <Grid item xs={4}>
                <Button
                  onClick={scanNetwork}
                  size="large"
                  variant="contained"
                  color="primary"
                  className={classes.pos}
                >
                  Scan Network
                </Button>
              </Grid>
            </Grid>

            <Grid
              container
              direction="column"
              justify="flex-start"
              alignItems="stretch"
              spacing={1}
              className={classes.sectionBody}
            >
              {aliveIpList.map((b, idx) => {
                return <DevicesComponent ip={b} key={idx} />;
              })}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </MuiThemeProvider>
  );
}

const DevicesComponent = (props) => {
  const classes = useStyles();
  const bull = <span className={classes.bullet}>•</span>;
  const b = props.ip;
  return (
    <Grid item xs={12}>
      <Card classes={{ root: classes.card }}>
        <CardContent classes={{ root: classes.cardContent }}>
          <span>{b.ip}</span>
          <span>{b.mac}</span>
        </CardContent>
      </Card>
    </Grid>
  );
};

const theme = createMuiTheme({
  typography: {
    // Use the system font.
    fontFamily: "Poppins",
  },
});

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: "5px",
    backgroundColor: "#008379",
    color: "#fff",
  },
  sectionHead: {
    minHeight: "24vh",
  },
  sectionBody: {
    minHeight: "74vh",
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    backgroundColor: "#122448",
  },
  cardContent: {
    paddingBottom: "16px !important",
  },
}));
