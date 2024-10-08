import { MainProcesses } from "./MainProcesses";
import { BrowserWindow, Menu, systemPreferences } from "electron";

/**
 * Application menu.
 */

export class ApplicationMenu {
    _mainProcesses: MainProcesses;
    constructor(mainProcesses: MainProcesses) {
        this._mainProcesses = mainProcesses;
        // remove annoying emoji menus in macos
        try {
            if (process.platform === "darwin") {
                systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true);
                systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true);
                systemPreferences.setUserDefault('NSDisabledAutoFillContactMenuItem', 'boolean', true);
            }
        } catch (e) {

        }
    }

    createApplicationMenu = () => {
        // Create a custom menu template
        const menuTemplate = [
            {
                label: 'File',
                submenu: [
                    { role: 'quit' } // Add other file-related menu items as needed
                ],
            },
            {
                label: 'Edit',
                submenu: [
                    { role: 'cut' },
                    // todo: on macos, "copy" generate an annoying Auto Fill menu
                    { role: 'copy' },
                    { role: 'paste' },
                    { type: 'separator' },
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'close' },
                ],
            },
            {
                label: 'View',
                submenu: [
                    // { role: 'reload' },
                    {
                        label: 'About',
                        click: () => {
                            // Handle the click event for the custom item
                            // console.log('Custom Item Clicked');
                            // get focused display/main window
                            const focusedBrowserWindow = BrowserWindow.getFocusedWindow();
                            for (let mainProcess of this.getMainProcesses().getProcesses()) {
                                const windowAgentsManager = mainProcess.getWindowAgentsManager();
                                for (let windowAgent of Object.values(windowAgentsManager.getAgents())) {
                                    const browserWindow = windowAgent.getBrowserWindow();
                                    if (browserWindow === focusedBrowserWindow) {
                                        // show about
                                        windowAgent.showAboutTdm();
                                    }
                                }
                            }
                        },
                    },
                    { role: 'toggleDevTools' }
                ]
            },
        ];
        const menu = Menu.buildFromTemplate(menuTemplate as any);

        // Set the application menu
        Menu.setApplicationMenu(menu);
    }

    getMainProcesses = () => {
        return this._mainProcesses;
    }
}