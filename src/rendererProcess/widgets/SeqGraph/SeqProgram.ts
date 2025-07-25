// import { Channel, ChannelMonitor, Context } from "epics-tca";

import { TcaChannel } from "../../channel/TcaChannel";
import { g_widgets1 } from "../../global/GlobalVariables";
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

    start = () => {
        for (const stateSet of this.getStateSets()) {
            stateSet.start();
        }
        this.setStatus("running");
    }

    pause = () => {
        for (const stateSet of this.getStateSets()) {
            stateSet.pause();
        }
        this.setStatus("stopped");
    }

    checkCurrentStates = () => {
        console.log("aaa")
        for (const stateSet of this.getStateSets()) {
            stateSet.checkCurrentState();
        }
    }

    /**
     * Clear the all the data in this program, including all state sets
     */
    clear = () => {
        for (const stateSet of this.getStateSets()) {
            stateSet.clear();
        }
        this.getStateSets().length = 0;
    }

    compareChannelNum = (channelName: string, compare: ">" | "===" | "<", value: number) => {
        try {
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            const channel = g_widgets1.getTcaChannel(channelName);
            const channelValue = channel.getValue();
            if (typeof channelValue === "number") {
                if (compare === ">") {
                    return channelValue > value;
                } else if (compare === "===") {
                    return channelValue === value;
                } else if (compare === "<") {
                    return channelValue < value;
                }
            }
        } catch (e) {
            console.log("Failed to put channel value for", channelName);
        }
        return false;
    }

    putChannel = (channelName: string, value: number) => {
        try {
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            const channel = g_widgets1.getTcaChannel(channelName);
            channel.put(displayWindowId, { value: value }, 1);
        } catch (e) {
            console.log("Failed to put channel value for", channelName);
        }
    }


    registerChannels = (...channelNames: (string | string[])[]) => {
        for (const channelName of channelNames) {
            if (typeof channelName === "string") {
                this.getChannelNames().push(channelName);
            } else if (Array.isArray(channelName)) {
                this.registerChannels(channelName);
            }
        }
    }

    getChannelNames = () => {
        return this._channelNames;
    }

}

export class SeqStateSet {
    _id: number = (id++);
    _program: SeqProgram;
    _name: string;
    _states: SeqState[] = [];
    _currentState: SeqState | undefined = undefined;
    _previousCondition: Condition | undefined = undefined;
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
    checkCurrentState = () => {
        const currentState = this.getCurrentState();
        // console.log("check current state", currentState?.getName())
        if (currentState !== undefined) {
            currentState.checkConditions();
        }
    }

    start = () => {
        // set the starting state
        const firstState = this.getStates()[0];
        if (firstState !== undefined) {
            // execute the entry function
            this.setCurrentState(firstState);
            const entryFunc = firstState.getEntryFunc();
            entryFunc();
            this.checkCurrentState();
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
    constructor(stateSet: SeqStateSet, name: string, entryFunc: () => void, exitFunc: () => void) {
        this._stateSet = stateSet;
        this._name = name;
        this._entryFunc = entryFunc;
        this._exitFunc = exitFunc;
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

    checkConditions = () => {
        // console.log("check conditions on ss", this.getName())
        for (const condition of this.getConditions()) {
            const booleanFunc = condition.getBooleanFunc();

            // transition to next state
            if (booleanFunc() === true) {
                // execute exec function of this condition
                const execFunc = condition.getExecFunc();
                execFunc();

                // execute exit function of this state
                const exitFunc = this.getExitFunc();
                exitFunc();

                // go to next state
                const nextState = condition.getNextState();
                this.getStateSet().setCurrentState(nextState);
                this.getStateSet().setPreviousCondition(condition);
                console.log("Leave state", this.getName());
                console.log("Go to next state:", nextState.getName());

                // execute next state's entry function
                const nextEntryFunc = nextState.getEntryFunc();
                nextEntryFunc();

                // stops at the first true condition
                break;
            }
        }
    }

    getId = () => {
        return this._id;
    }

}

export class Condition {
    _id: number = (id++);
    _nextState: SeqState;
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
        return this._execFuncText;
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

