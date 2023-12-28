import React from "react";
import { createStyles } from "@mantine/core";

const useStyles = createStyles((theme, params) => ({
  wrapper: {
    width: 400,
    position: "fixed",
    top: 10,
    right: 30,
    zIndex: 2147483646,
    backgroundColor: "white",
    borderRadius: 8,
    borderColor: 'blue',
    borderWidth: 2,
    borderStyle: "solid",
    padding: 20,
    color: "blue"
  },
  container: {
    backgroundColor: "#FFF",
    display: "flex",
    maxHeight: "90vh",
    width: "250px",
    boxSizing: "border-box",
    flexDirection: "column",
    borderRadius: "8px",
    boxShadow: "4px 10px 45px 3px #888888",
    overflowY: "auto",
    alignItems: "center",
  },
  header: {
    width: "100%",
    position: "sticky",
    top: "0px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    boxSizing: "border-box",
  },

  loginHeader: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "87px",
    boxSizing: "border-box",
  },

  headerButtonsContainer: {
    display: "flex",
    alignItems: "center",
  },

  headerButton1: {
    fontSize: "23px",
    color: "#fff",
    cursor: "pointer",
  },

  headerButton2: {
    fontSize: "25px",
    color: "#fff",
    cursor: "pointer",
  },

  headerButtonSepreater: {
    borderRight: "0.1px solid #ddd",
    margin: "0px 10px",
    height: "18px",
  },

  content: {
    width: "100%",
    // padding: `${GLOBAL_STYLES.PADDING}px`,
    boxSizing: "border-box",
  },
}));

export default useStyles;
