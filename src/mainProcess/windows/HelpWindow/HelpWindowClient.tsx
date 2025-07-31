
import ReactDOM from "react-dom/client";
import React from "react";
import { Help } from "../../../rendererProcess/widgets/Help/Help";


export class HelpWindowClient {}

(window as any).HelpWindowClientClass = HelpWindowClient;

const help = new Help();

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(help.getElment());  