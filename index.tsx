#!/usr/bin/env node
import { render } from "ink";
import { App } from "./src/App.js";

const args = process.argv.slice(2);
const debugMode = args.includes("--debug");

render(<App debugMode={debugMode} />);
