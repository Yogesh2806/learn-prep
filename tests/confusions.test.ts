import { confusionChecks } from "../lib/confusions";

// Should flag → they're; should not flag real possessives or "there is/are".
const flag = ["Their going to the office tomorrow.", "Their coming tomorrow.", "I think their leaving soon.", "There going home.", "Their not ready.", "their gonna win"];
const pass = ["Their meeting at 5 got moved.", "Their wedding was lovely.", "Their building is tall.", "Their training starts Monday.", "There are two.", "Their car is red.", "Their leaving was sudden.", "There is nothing here."];
let bad = 0;
for (const s of flag) if (!confusionChecks(s).length) { bad++; console.log("missed:", s); }
for (const s of pass) if (confusionChecks(s).length) { bad++; console.log("false alarm:", s); }
console.log(`${flag.length + pass.length} sentences, ${bad} wrong`);
if (bad) process.exit(1);
