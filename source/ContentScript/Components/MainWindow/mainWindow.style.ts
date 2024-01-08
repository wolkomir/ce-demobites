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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundedButton: {
    width: '188px',
    height: '30px',
    border: `1px solid ${COLORS.PRIMARY}`,
    backgroundColor: 'white',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'black',
    cursor: 'pointer',
  },
  redOval: {
    background: '#FF0000',
    width: '12px',
    height: '12px',
    borderRadius: '6px',
    marginRight: '7px',
  },
  recordText: {
    fontSize: '16px',
    color: COLORS.PRIMARY,
  },
  dropdownContainer: {
    background: "white",
    border: `2px solid ${COLORS.PRIMARY}`,
    boxShadow: '0 0 7px 7px rgba(0,0,0,0.08)',
    borderRadius: VALUES.BORDER_RADIUS,
    width: '200px',
    height: '150px',
  }
}));

export default useStyles;
