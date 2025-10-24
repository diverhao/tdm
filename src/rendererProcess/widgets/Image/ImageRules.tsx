import { Image, type_Image_tdl } from "./Image";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ImageRule } from "./ImageRule";


export class ImageRules extends BaseWidgetRules {
	constructor(image: Image, imageTdl: type_Image_tdl) {
		super(image, imageTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new ImageRule(ii, this);
			this.getRules().push(newRule);
		}
	};

    // (1) create a new tdl
    // (2) create the new rule based on this new tdl, use the widget's value
	addRule = () => {
        // (1)
		const newRuleTdl = this.generateNewRuleTdl();
		this.getRulesTdl().push(newRuleTdl);
        // (2)
		const newRule = new ImageRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
