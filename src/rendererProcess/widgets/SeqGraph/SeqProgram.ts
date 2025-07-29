// import { Channel, ChannelMonitor, Context } from "epics-tca";

import { TcaChannel } from "../../channel/TcaChannel";
import { g_widgets1 } from "../../global/GlobalVariables";
import { convertEpochTimeToString } from "../Talhk/client/GlobalMethod";
import { SeqGraph } from "./SeqGraph";

let id = 0;

// /* user var size */     0,
// /* param */             "",
// /* num. event flags */  0,
// /* encoded options */   (0 | OPT_CONN | OPT_NEWEF),
// /* init func */         seqg_init,
// /* entry func */        0,
// /* exit func */         0,
// /* num. queues */       0
export class SeqProgram {
    _magicNumber: number = Math.round(Math.random() * 1000000);
    _name: string;
    _status: "running" | "stopped" = "stopped";
    _mainWidget: SeqGraph;
    _stateSets: SeqStateSet[] = [];
    _channelNames: string[] = [];
    _log: string[] = [];
    _stateSwitchCount: number[] = [];


    constructor(name: string, mainWidget: SeqGraph) {
        this._name = name;
        this._mainWidget = mainWidget;
    }

    getMainWidget = () => {
        return this._mainWidget;
    }

    getMagicNumber = () => {
        return this._magicNumber;
    }
    getName = () => {
        return this._name;
    }

    getStatus = () => {
        return this._status;
    }

    setStatus = (newStatus: "running" | "stopped") => {
        this._status = newStatus;
    }

    setName = (newName: string) => {
        this._name = newName;
    }

    getStateSets = () => {
        return this._stateSets;
    }

    getStateSet = (stateSetName: string) => {
        for (const stateSet of this.getStateSets()) {
            if (stateSet.getName() === stateSetName) {
                return stateSet;
            }
        }
        return undefined;
    }

    addStateSet = (newStateSet: SeqStateSet) => {
        this.getStateSets().push(newStateSet);
    }

    start = async () => {
        this.resetStateSwitchCount();
        this.setStatus("running");
        for (const stateSet of this.getStateSets()) {
            await stateSet.start();
        }
    }

    pause = () => {
        for (const stateSet of this.getStateSets()) {
            stateSet.pause();
        }
        this.setStatus("stopped");
    }

    checkCurrentStates = async () => {
        // skip if we are in the middle of checking conditions
        for (const stateSet of this.getStateSets()) {
            await stateSet.checkCurrentState(false);
        }
    }

    /**
     * Clear the all the data in this program, including all state sets
     */
    clear = () => {
        for (const stateSet of this.getStateSets()) {
            stateSet.clear();
        }
        this.clearLog();
        this.getStateSets().length = 0;
    }


    getChannelNames = () => {
        return this._channelNames;
    }

    getLog = () => {
        return this._log;
    }

    prependLog = (newLog: string) => {
        const timeStr = convertEpochTimeToString(Date.now());
        this.getLog().unshift("[" + timeStr + "] " + newLog);
        this.getMainWidget().updateLogElement({});
    }

    clearLog = () => {
        this.getLog().length = 0;
        this.getMainWidget().updateLogElement({});
    }

    getStateSwitchCount = () => {
        return this._stateSwitchCount.length;
    }
    increaseStateSwitchCount = () => {
        const timeNow = Date.now();
        let numExpire = 0;
        for (const time of this._stateSwitchCount) {
            if (timeNow - time > 10 * 1000) {
                numExpire++;
            } else {
                break;
            }
        }
        this._stateSwitchCount.splice(0, numExpire);
        this._stateSwitchCount.push(Date.now());
        console.log(this._stateSwitchCount)
    }
    resetStateSwitchCount = () => {
        this._stateSwitchCount.length = 0;
    }
}

export class SeqStateSet {
    _id: number = (id++);
    _program: SeqProgram;
    _name: string;
    _states: SeqState[] = [];
    _currentState: SeqState | undefined = undefined;
    _previousCondition: Condition | undefined = undefined;
    _busyCheckingConditions: boolean = false;

    constructor(program: SeqProgram, name: string) {
        this._program = program;
        this._name = name;
    }

    getProgram = () => {
        return this._program;
    }

    getName = () => {
        return this._name;
    }

    getStates = () => {
        return this._states;
    }

    getBusyCheckingConditions = () => {
        return this._busyCheckingConditions;
    }

    setBusyCheckingConditions = (busy: boolean) => {
        this._busyCheckingConditions = busy;
    }

    addState = (newState: SeqState) => {
        this.getStates().push(newState);
    }

    getState = (stateName: string) => {
        for (const state of this.getStates()) {
            if (state.getName() === stateName) {
                return state;
            }
        }
        return undefined;
    }

    getCurrentState = () => {
        return this._currentState;
    }

    setCurrentState = (newState: SeqState | undefined) => {
        this._currentState = newState;
    }

    getPreviousCondition = () => {
        return this._previousCondition;
    }

    setPreviousCondition = (cond: Condition | undefined) => {
        this._previousCondition = cond;
    }

    setCurrentStateByName = (newStateName: string) => {
        const newState = this.getState(newStateName);
        if (newState !== undefined) {
            this._currentState = newState;
        } else {
            // todo ...
        }
    }

    clear = () => {
        this.setCurrentState(undefined);
        this.setPreviousCondition(undefined);
        for (const state of this.getStates()) {
            state.clear();
        }
        this.getStates().length = 0;

    }

    /**
     * Invoked on any Channel monitor update
     */
    checkCurrentState = async (newEntrance: boolean) => {
        if (this.getBusyCheckingConditions() === false) {
            const currentState = this.getCurrentState();
            // console.log("check current state", currentState?.getName())
            if (currentState !== undefined) {
                await currentState.checkConditions(newEntrance);
            }
        }
    }

    start = async () => {
        // set the starting state
        const firstState = this.getStates()[0];
        if (firstState !== undefined) {
            // execute the entry function
            this.setCurrentState(firstState);
            await this.checkCurrentState(true);
        } else {
            throw new Error(`No Seq State defined in state set ${this.getName}`);
        }
    }

    pause = () => {
        this.setCurrentState(undefined);
        this.setPreviousCondition(undefined);
    }

    getId = () => {
        return this._id;
    }

}



// /* state name */        "light_off",
// /* action function */   seqg_action_volt_check_0_light_off,
// /* event function */    seqg_event_volt_check_0_light_off,
// /* entry function */    0,
// /* exit function */     0,
// /* event mask array */  seqg_mask_volt_check_0_light_off,
// /* state options */     (0)

export class SeqState {
    _id: number = (id++);
    _stateSet: SeqStateSet
    _name: string;
    _conditions: Condition[] = [];
    _entryFunc: () => void;
    _exitFunc: () => void;
    _entryFuncStr: string = "";
    _exitFuncStr: string = "";
    constructor(stateSet: SeqStateSet, name: string, entryFunc: () => void, exitFunc: () => void, entryFuncStr: string, exitFuncStr: string) {
        this._stateSet = stateSet;
        this._name = name;
        this._entryFunc = entryFunc;
        this._exitFunc = exitFunc;
        this._entryFuncStr = entryFuncStr;
        this._exitFuncStr = exitFuncStr;
    }

    getContentStr = () => {
        let result = "";

        // entry function
        if (this.getEntryFuncStr() !== "") {
            result = result + "entry {\n";
            this.getEntryFuncStr().split("\n").forEach((line) => {
                if (line.trim() !== "") {
                    result = result + "    " + line.trim() + "\n";
                }
            });
            result = result + "}\n\n";
        }

        // conditions
        for (const condition of this.getConditions()) {
            result = result + condition.getContentStr();
        }

        // exit function
        if (this.getExitFuncStr() !== "") {
            result = result + "exit {\n";
            this.getExitFuncStr().split("\n").forEach((line) => {
                if (line.trim() !== "") {
                    result = result + "    " + line.trim() + "\n";
                }
            });
            result = result + "}\n\n";
        }
        // result = result + "}\n";
        return result;
    }

    getConditionsContentLeadingToThisState = () => {

        let resultStr: string = "";
        for (const state of this.getStateSet().getStates()) {
            let tmpStr = "";
            for (const condition of state.getConditions()) {
                if (condition.getNextState() === this) {
                    const conditionStr = condition.getContentStr();
                    tmpStr = tmpStr + conditionStr;
                }
            }
            if (tmpStr !== "") {
                resultStr = resultStr + "// ----- state " + state.getName() + " -----\n\n" + tmpStr;
            }
        }

        return resultStr
    }


    getEntryFuncStr = () => {
        return this._entryFuncStr;
    }

    getExitFuncStr = () => {
        return this._exitFuncStr;
    }

    getStateSet = () => {
        return this._stateSet;
    }

    getEntryFunc = () => {
        return this._entryFunc;
    }

    getExitFunc = () => {
        return this._exitFunc;
    }

    getName = () => {
        return this._name;
    }

    getConditions = () => {
        return this._conditions;
    }

    addCondition = (newCondition: Condition) => {
        this.getConditions().push(newCondition);
    }

    clear = () => {
        for (const condition of this.getConditions()) {
            condition.clear();
        }
        this.getConditions().length = 0;
    }

    /**
     * if the user stops the program, this function throws an exception
     */
    checkConditions = async (newEntrance: boolean) => {
        this.getStateSet().setBusyCheckingConditions(true);

        let nextState: undefined | SeqState = undefined;

        if (newEntrance) {
            // execute entry function if this is a new state
            const entryFunc = this.getEntryFunc();
            await entryFunc();
        }

        for (const condition of this.getConditions()) {
            const booleanFunc = condition.getBooleanFunc();
            console.log("booleanFunc", booleanFunc)
            console.log("booleanFunc starts")
            const booleanResult = await booleanFunc();
            console.log("booleanFunc ends")
            // transition to next state
            if (booleanResult === true) {
                // execute exec/action function of this condition
                const execFunc = condition.getExecFunc();
                await execFunc();

                // go to next state
                nextState = condition.getNextState();
                this.getStateSet().setCurrentState(nextState);
                this.getStateSet().setPreviousCondition(condition);

                // check if there are too many state switches, 300 switches within 10 seconds
                this.getStateSet().getProgram().increaseStateSwitchCount();
                if (this.getStateSet().getProgram().getStateSwitchCount() > 300) {
                    // pause the program
                    this.getStateSet().getProgram().getMainWidget().stopSeqProgram();
                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                    displayWindowClient.getIpcManager().handleDialogShowMessageBox(undefined, {
                        messageType: "error",
                        humanReadableMessages: ["There are more than 300 state switches in last 10 seconds. The program is stopped. Please check your program."],
                        rawMessages: [],
                    })
                    // return immediately
                    return;
                }

                console.log("Leave state", this.getName());
                console.log("Go to next state:", nextState.getName());

                // stops at the first true condition
                break;
            }
        }

        // execute exit function if there is a next state, and the next state is different from current state
        if (nextState !== undefined && nextState !== this) {
            const exitFunc = this.getExitFunc();
            await exitFunc();
        }

        this.getStateSet().setBusyCheckingConditions(false);

        // check condition if there is a next state, and the next state is different from current state
        if (nextState !== undefined && nextState !== this) {
            await nextState.checkConditions(true);
        }

    }


    getId = () => {
        return this._id;
    }

}

export class Condition {
    _id: number = (id++);
    _nextState: SeqState;
    // _booleanFunc: () => Promise<boolean> = async () => { return new Promise((resolve) => { resolve(false) }) };
    _booleanFunc: () => boolean = () => { return false };
    _booleanFuncText: string = "";
    _execFunc: () => void = () => { };
    _execFuncText: string = "";
    constructor(nextState: SeqState, booleanFunc: () => boolean, execFunc: () => void, booleanFuncText: string, execFuncText: string) {
        this._nextState = nextState;
        this._booleanFunc = booleanFunc;
        this._execFunc = execFunc;
        this._booleanFuncText = booleanFuncText;
        this._execFuncText = execFuncText;
    }

    getContentStr = () => {
        let result = "";
        result = result + "when ";

        // remove the [1] index
        this.getBooleanFuncText().trim().split(" ").forEach((token, index) => {
            if (index === 0) {
                // skip the first line
                return;
            }
            result = result + token + " ";
        });


        result = result + "{\n";
        this.getExecFuncText().split("\n").forEach((line) => {
            if (line.trim() !== "") {
                result = result + "    " + line.trim() + "\n";
            }
        });
        // result = result + this.getExecFuncText() + "\n";
        result = result + "}";
        result = result + " state " + this.getNextState().getName() + "\n\n";
        return result;
    }

    getNextState = () => {
        return this._nextState;
    }

    getBooleanFunc = () => {
        return this._booleanFunc;
    }

    getExecFunc = () => {
        return this._execFunc;
    }

    getBooleanFuncText = () => {
        return this._booleanFuncText;
    }

    getExecFuncText = () => {
        const execFuncTextArray = this._execFuncText.split("\n");
        const resultArray: string[] = [];
        for (const text of execFuncTextArray) {
            if (text.trim() === "") {
                continue;
            }
            if (text.trim().startsWith("//")) {
                continue;
            }
            resultArray.push(text.trim());
        }
        return resultArray.join("\n");
    }

    getId = () => {
        return this._id;
    }

    clear = () => {
        // nothing to do
    }
}



// --------------------------------

// const prog = new SeqProgram("test01");
// const context = new Context();

// // create the program in top-down fashion

// const stateSet = new SeqStateSet(prog, "volt_check");
// prog.addStateSet(stateSet);

// let state_light_off = new SeqState(stateSet, "light_off",
//     () => { }, // entry function
//     () => { }, // exit function
// );
// let state_light_on = new SeqState(stateSet, "light_on",
//     () => { }, // entry function
//     () => { }, // exit function
// );
// stateSet.addState(state_light_off);
// stateSet.addState(state_light_on);


// state_light_off.addCondition(new Condition(state_light_on,
//     () => {
//         return SeqProgram.compareChannelNum(context, "Input_voltage", ">", 5.0);
//     }
//     ,
//     () => {
//         SeqProgram.putChannel(context, "Indicator_light", 1);
//     },
//     "aaa",
//     "bbb"
// ))

// state_light_on.addCondition(new Condition(state_light_off,
//     () => {
//         return SeqProgram.compareChannelNum(context, "Input_voltage", "<", 5.0);
//     },
//     () => {
//         SeqProgram.putChannel(context, "Indicator_light", 0);
//     },
//     "ccc",
//     "ddd",
// ))

// context.initialize().then(async () => {
//     // initialize the state sets
//     prog.init();

//     // create all channels
//     const Input_voltage_channel = await context.createChannel("Input_voltage", "ca");
//     const Indicator_light_channel = await context.createChannel("Indicator_light", "ca");
//     const Input_voltage_monitor = await Input_voltage_channel?.createMonitor(undefined, (monitor: ChannelMonitor) => {
//         prog.checkCurrentStates();
//     });

// })

// --------------- seq functions ------------------

export class SeqChannel {
    _program: SeqProgram;
    _channel: TcaChannel | undefined = undefined;
    constructor(program: SeqProgram) {
        this._program = program;
    }

    getProgram = () => {
        return this._program;
    }

    setChannel = (channel: TcaChannel) => {
        this._channel = channel;
    }

    getChannel = () => {
        return this._channel;
    }
}

