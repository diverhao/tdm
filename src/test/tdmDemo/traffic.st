
global.R = 0;
global.Y = 1;
global.G = 2;

global.lights = [    
    "traffic:red_light",
    "traffic:yellow_light",
    "traffic:green_light"
];

connect(...global.lights);

global.red_time = 3.0;
global.red_yellow_time = 1.0;
global.green_time = 4.0;
global.yellow_time = 1.0;

ss light {
    state red {  
        entry {
            caput(global.lights[global.R], 1);
            caput(global.lights[global.Y], 0);
            caput(global.lights[global.G], 0);
        }
        when (await delay(global.red_time)) {
            print("switch to red-yellow light");
        } state red_yellow
    }
    state red_yellow {
        entry {
            caput(global.lights[global.R], 1);
            caput(global.lights[global.Y], 1);
            caput(global.lights[global.G], 0);
        }
        when (await delay(global.red_yellow_time)) {
            print("switch to green light");
        } state green
    }
    state green {
        entry {
            caput(global.lights[global.R],0);
            caput(global.lights[global.Y],0);
            caput(global.lights[global.G],1);
        }
        when (await delay(global.green_time)) {
            print("switch to yellow light");
        } state yellow
    }
    state yellow {
        entry {
            caput(global.lights[global.R],0);
            caput(global.lights[global.Y],1);
            caput(global.lights[global.G],0);
        }
        when (await delay(global.yellow_time)) {
            print("switch to red light");            
        } state red
    }
    
}
