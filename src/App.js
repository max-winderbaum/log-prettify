import React, { Component } from "react";
import "./App.css";

import formatHighlight from "json-format-highlight";
import jsonParse from "json-parse-even-better-errors";
import prettier from "prettier-standalone";

const customColorOptions = {
  keyColor: "black",
  numberColor: "blue",
  stringColor: "#0B7500",
  trueColor: "#00cc00",
  falseColor: "#ff8080",
  nullColor: "cornflowerblue",
};

const strategies = [
  {
    name: "JSON.parse",
    func: (str) => jsonParse(str),
  },
  {
    name: "eval",
    func: (str) => {
      eval(`window.json = ${str}`); // eslint-disable-line no-eval
      return window.json;
    },
  },
  {
    name: "JSON.parse with formatJson",
    func: (str) => JSON.parse(formatJson(str)),
  },
  {
    name: "prettier",
    func: (str) => prettier.format(`log = ${str}`, { parser: "babel" }),
  },
];

function prettifyJson(input) {
  let output = "";
  let brackets = getBrackets(input);
  console.log(input);
  console.log(brackets);
  for (let str of brackets) {
    console.log("Trying string", str);
    let success = false;

    for (let strategy of strategies) {
      try {
        let jsonObj = strategy.func(str);
        const formattedString = formatHighlight(jsonObj, customColorOptions);
        output += formattedString + "\n";
        console.log("Success with strategy", strategy.name);
        console.log("formatted string", formattedString);
        console.log("string", str);
        console.log("");
        success = true;
        break;
      } catch (e) {
        console.log("Failed with strategy", strategy.name);
        console.log(e);
      }
    }
    if (!success) {
      console.log("Outputting the regular string", "\n");
      output += formatRegularString(str) + "\n";
    }
    output += "<hr>";
  }
  return formatHtml(output);
}

function formatRegularString(str) {
  return str
    .trimLeft()
    .replace(/\n +/g, "\n");
}

function formatJson(str) {
  return str
    .replace(/(?=[^\\])"/g, '\\"')
    .replace(/'/g, '"')
    .replace(/\n/g, "\\n");
}

function formatHtml(str) {
  return str
    .replace(/\n/g, "<br>")
    .replace(/\\n/g, "<br>")
    .replace(/\\"/g, '"');
}

function getBrackets(str) {
  const result = []; // create an empty array to store the results
  const openingBrackets = ["[", "{"]; // define an array of opening brackets
  const closingBrackets = ["]", "}"]; // define an array of closing brackets

  let numOpenBrackets = 0; // create a variable to store the number of open brackets
  let currentString = ""; // create a variable to store the current string

  for (let i = 0; i < str.length; i++) {
    let char = str[i]; // store the current character in a variable
    if (openingBrackets.includes(char)) {
      if (numOpenBrackets === 0 && currentString.length > 1) {
        // if there are no open brackets
        result.push(currentString);
        currentString = ""; // reset the current string
      }
      numOpenBrackets++; // increment the number of open brackets
      currentString += str[i]; // add the current character to the current string
    } else if (closingBrackets.includes(char) && numOpenBrackets > 0) {
      numOpenBrackets--; // decrement the number of open brackets
      currentString += str[i]; // add the current character to the current string
      if (numOpenBrackets === 0) {
        // if there are no open brackets
        result.push(currentString); // push the current string to the result array
        currentString = ""; // reset the current string
      }
    } else {
      currentString += str[i]; // add the current character to the current string
    }
  }
  return result;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.divRef = React.createRef();
  }

  componentDidMount() {
    navigator.permissions.query({ name: "clipboard-read" }).then((result) => {
      // If permission is granted or prompt
      if (result.state === "granted" || result.state === "prompt") {
        // Read the clipboard
        navigator.clipboard.readText().then((text) => {
          let out = prettifyJson(text);
          this.divRef.current.innerHTML = out;
        });
      }
    });
  }

  render() {
    return <pre className="App" ref={this.divRef}></pre>;
  }
}

export default App;
