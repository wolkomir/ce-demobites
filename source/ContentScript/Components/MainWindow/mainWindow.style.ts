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
  },
}));

export default useStyles;
