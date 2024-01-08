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
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 241721312,
  },
  infoContainer: {
    background: "#FFFFFF",
    borderRadius: VALUES.BORDER_RADIUS,
    width: "365",
    height: "70px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: '30px',
  },
  infoText: {
    fontFamily: "LucidaGrande",
    fontSize: "12px",
    color: "#000000",
    textAlign: "center",
  },
  deleteButtonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "25px",
    cursor: 'pointer',
  },
  deleteRecordingText: {
    fontFamily: "LucidaGrande",
    fontSize: "10px",
    color: "#FF0000",
  },
}));

export default useStyles;
