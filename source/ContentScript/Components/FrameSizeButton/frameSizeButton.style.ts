import { createStyles } from "@mantine/core";
import { COLORS, VALUES } from "../../../Config/styles";

const useStyles = createStyles((theme, params) => ({
  container_16_9: {
    width: 32,
    height: 14,
    backgroundColor: 'white',
    borderColor: COLORS.PRIMARY,
    borderRadius: 2,
    borderWidth: VALUES.BORDER_WIDTH,
    borderStyle: 'solid',
  },
  container_4_3: {
    width: 19,
    height: 14,
    backgroundColor: 'white',
    borderColor: COLORS.PRIMARY,
    borderRadius: 2,
    borderWidth: VALUES.BORDER_WIDTH,
    borderStyle: 'solid',
  },
  container_reset: {
    width: 32,
    height: 14,
    backgroundColor: 'white',
    borderColor: '#DCDCDC',
    borderRadius: 2,
    borderWidth: VALUES.BORDER_WIDTH,
    borderStyle: 'solid',
  },
}));

export default useStyles;
