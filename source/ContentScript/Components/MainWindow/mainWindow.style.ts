import { createStyles } from "@mantine/core";
import { COLORS, VALUES } from "../../../Config/styles";

const useStyles = createStyles((theme, params) => ({
  container: {
    width: 214,
    height: 149,
    position: "fixed",
    top: 10,
    right: 30,
    backgroundColor: 'white',
    borderColor: COLORS.PRIMARY,
    borderRadius: VALUES.BORDER_RADIUS,
    borderWidth: VALUES.BORDER_WIDTH,
    borderStyle: 'solid',
    padding: VALUES.PADDING,
    boxShadow: '0 0 7px 7px rgba(0,0,0,0.08)',
    fontFamily: "HelveticaNeue",
  },
}));

export default useStyles;
