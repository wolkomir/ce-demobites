import { createStyles } from "@mantine/core";
import { COLORS, VALUES } from "../../../Config/styles";

const useStyles = createStyles((theme, params) => ({
  container: {
    position: "fixed",
    width: "100%",
    height: "100vh",
    maxHeight: "100vh",
    backgroundColor: 'rgba(98,93,245,0.52)',
    top: 0,
    left: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 241721312,
  },
  countDownOval: {
    background: COLORS.PRIMARY,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: "234px",
    height: "234px",
    borderRadius: "50%",
  },
  countDownText: {
    fontFamily: 'HelveticaNeue',
    fontSize: '140px',
    color: '#FFFFFF',
  },
  infoContainer: {
    position: "absolute",
    top: '34px',
    right: '269px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '40px',
  },
  infoText: {
    fontFamily: "Lato-Regular",
    fontSize: "36px",
    color: "#FFFFFF",
    textAlign: "center",
  },
  recordingIconOval: {
    background: "#FF0000",
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    marginLeft: '20px',
    marginRight: '20px',
  }
}));

export default useStyles;
