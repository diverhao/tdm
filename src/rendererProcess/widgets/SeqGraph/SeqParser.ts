import * as peg from "pegjs";

const grammar = `
{
    // let a = 33;
    let preambleFinished = false;
    const result = {};
    result["name"] = "";
    result["stateSets"] = [];
}

// ----------------------- start ------------------------

start
    = lines:lines _ EOF {
        return result;
    }

lines
    = head:line tail:(_ l:line)* {
        return [head, ...tail.map(([, l]) => {return l})];
    }

line
    = comment_block
      / comment_line
      / state_set


// -------------- comments ------------------

comment
    = comment: (comment_block / comment_line) {
        return {
            comment: comment
        }
    }

comment_block
  = _ "/*" (!"*/" .)* "*/" _

comment_line
    = _ "//" [^\\n]* ("\\n" / !.) _

// ----------- state set -----------------------

state_set
  = _ "ss" __ name:variable_name _ "{" _ entries:(state_set_entry*) _ "}" _ {
      const stateSetResult = {};
      stateSetResult["name"] = name;
      stateSetResult["states"] = [];

      if (entries === null) {
          
      } else {

          for (const entry of entries) {
            if (entry["type"] === "comment") {
    
            } else if (entry["type"] === "state") {
                stateSetResult["states"].push(entry["value"]);
            }
          }
      }
      result["stateSets"].push(stateSetResult)
    }


state_set_entry
  = _ entry:(comment:comment {
                return { type: "comment", value: comment };
            }
          / state:state {
                return { type: "state", value: state };
            }
          ) _ {
      return entry;
  }



// -------------- state ------------------------

state
    = _ "state" __ name:variable_name _ "{" _ entries:state_entry* _ "}" _ {

      const stateResult = {};
      stateResult["name"] = name;
      stateResult["entryBlocks"] = [];
      stateResult["conditions"] = [];
      stateResult["exitBlocks"] = [];

      if (entries === null) {
      }
      else {
      for (const entry of entries) {
            if (entry["type"] === "comment") {
    
            } else if (entry["type"] === "condition") {
                stateResult["conditions"].push(entry["value"]);
            } else if (entry["type"] === "entry_block") {
                stateResult["entryBlocks"].push(entry["value"]);
            } else if (entry["type"] === "exit_block") {
                stateResult["exitBlocks"].push(entry["value"]);
            }
          }
      }

      return stateResult;
    }


state_entry
  = _ entry:(comment:comment {
                return { type: "comment", value: comment };
            }
          / condition:condition {
                return { type: "condition", value: condition };
            }
          / exitBlock:state_exit_block {
                return { type: "exit_block", value: exitBlock };
            }
          / entryBlock:state_entry_block {
                return {type: "entry_block", value: entryBlock};
            }) _ {
       console.log(entry);
      return entry;
  }

state_entry_block
    = "entry" _ action:balanced_braces {
        return {
            action: action,
        }
    }

state_exit_block
    = "exit" _ action:balanced_braces {
        return {
            action: action,
        }
    }

// ---------------- condition ---------------------------

condition
    = _ "when" _ booleanCondition:balanced_brackets _ action:balanced_braces _ "state" __ next_state:variable_name  _ {
        return {
            booleanCondition: booleanCondition,
            action: action,
            nextState: next_state,
        }
    }

boolean_condition
    = [^()]*


// ------------ scalar variable definition -------------------
// double a = 77;
// double a;
// string a = "abcd";
// string a;
// char *a = "abcd";
// char *a;

variable_scalar_def
    = type:(variable_num_type / variable_str_type) __ name:variable_name _ value:(variable_num_value / variable_str_value)? _ ";" {
        return {
            type: type,
            name: name,
            value: value,
        }
    }

variable_num_type
    = "float" / "short" / "double" / "char" / "long" / "int8_t" / "uint8_t" /  "int16_t" / "uint16_t" /  "int32_t" / "uint32_t" /  "int64_t" / "uint64_t" / "int"

variable_str_type
    = strType:(("char" _ "*") / "string") {
        if (Array.isArray(strType)) {
            return "char *";
        } else {
            return "string";
        }
        
    }

variable_num_value
    = "=" _ value:number {
        return value;
    }


variable_str_value
    = "=" _ value:str {
        return value;
    }


// ---------------- array variable definition --------------------------
// int a[] = {1.1,2.2,3.2};
// float a[3] = {1.1,2.2,3.2};
// int a[3];
// int a[];

array
    = number_array / string_array

number_array
  = _ "[" _ numbers:number_list _ "]" _ {
      return numbers;
  }

number_list
  = head:number tail:(_ "," _ number)* {
      return [head, ...tail.map(e => e[3])];
  }

string_array
  = _ "[" _ strings:string_list _ "]" _ {
      return strings;
  }

string_list
  = head:quoted_string tail:(_ "," _ quoted_string)* {
      return [head, ...tail.map(e => e[3])];
  }

quoted_string
  = "\\"" chars:char* "\\"" {
      return chars.join("");
  }




// ------------- helpers -----------------------

_  = [ \\t\\r\\n]*  // optional whitespace
__  = [ \\t\\r\\n]+   // required whitespace

number
  = digits:[0-9.]+ { return parseFloat(digits.join("")); }


variable_name
    = name:[a-zA-Z0-9_]+ {
        return name.join("");
    }

// possibly with macros
pv_name
    = name:[a-zA-Z0-9_.\\{\\}:-]+ {
        return name.join("")
    }

EOF
  = !.

str
  = "\\"" chars:char* "\\"" {
      return chars.join("");
    }

char
  = escape / unescaped

unescaped
  = [^"\\\\]

escape
  = "\\\\" char:[\\\\nrt"'] {
      const map = { n: "\\n", r: "\\r", t: "\\t", '"': '"', "'": "'", "\\\\": "\\\\" };
      return map[char];
  }


balanced_braces
    = "{" _ content:brace_content _ "}" {
          // return "{" + content + "}"
          return content
      }

brace_content
    = parts:(balanced_braces / non_brace_char)* {
          return parts.join('');
      }


balanced_brackets
    = "(" _ content:bracket_content _ ")" {
          return "(" + content + ")"
      }

bracket_content
    = parts:(balanced_brackets / non_bracket_char)* {
          return parts.join('');
      }

non_brace_char
    = [^{}]

non_bracket_char
    = [^()]
// ----------------------------------------

`;



const stripComments = (code: string) => {
    return code
        // Remove all multiline comments (/* ... */)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove all single-line comments (// ...)
        .replace(/\/\/.*$/gm, '');
}

const processPreamble = (code: string) => {
	const lines = code.split("\n");
	let start = 0;
	let end = -1;
	for (let ii = 0; ii < lines.length; ii++) {
		const line = lines[ii];
		if (line.trim().startsWith("ss")) {
			end = ii;
			break;
		}
	}
	return {
		code: lines.slice(end).join("\n"),
		preamble: lines.slice(start, end).join("\n"),
	};
};

export const parseSeq = (input: string) => {
    let code = stripComments(input);
    const tmp = processPreamble(code);
    code = tmp["code"];
    const preamble = tmp["preamble"];
    
    const parser = peg.generate(grammar);
    const result = parser.parse(code);
    const stateSets = result["stateSets"];
    return {
        preamble: preamble,
        stateSets: stateSets,
    }
}
