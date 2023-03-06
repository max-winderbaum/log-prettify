import React, { Component } from "react"
import "./App.css"

import formatHighlight from "json-format-highlight";
import jsonParse from "json-parse-even-better-errors";

const customColorOptions = {
  keyColor: "black",
  numberColor: "blue",
  stringColor: "#0B7500",
  trueColor: "#00cc00",
  falseColor: "#ff8080",
  nullColor: "cornflowerblue",
};

function prettifyJson(input) {
  let output = "";
  let brackets = getBrackets(input);
  console.log(input)
  console.log(brackets);
  for (let str of brackets) {
    console.log("Trying string", str);
    try {
      let jsonObj = jsonParse(str);
      output += formatHighlight(jsonObj, customColorOptions) + "\n";
      console.log("Success")
    } catch (e) {
      console.log("Trying formatting the string like this:", formatJson(str), e);
      try {
        let jsonObj = jsonParse(formatJson(str));
        output += formatHighlight(jsonObj, customColorOptions) + "\n";
        console.log("Success")
      } catch (e) {
        console.log("Outputting the regular string", e, "\n")
        output += str + "\n";
      }
    }
  }
  return formatHtml(output);
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
  const regex = /(\[.*?\])|({.*?})|([^\[{}\]]+)/g; // define a regular expression that matches any text between [], or {}, or any text that is not a bracket
  let match; // create a variable to store each match
  while ((match = regex.exec(str))) {
    // loop through all matches in the string
    result.push(match[0]); // push each match to the result array
  }
  return result; // return the result array
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
    return <div className="App" ref={this.divRef}></div>;
  }
}

export default App
