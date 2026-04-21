import { Platform } from "react-native";

let Component;

if (Platform.OS === "web") {
  Component = require("./index.web").default;
} else {
  Component = require("./index.native").default;
}

export default Component;