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

function prettifyJson(input, filter) {
  let output = "";
  let brackets = getBrackets(input);
  console.log(input);
  console.log(brackets);
  for (let str of brackets) {
    console.log("Trying string", str);
    let success = false;

    for (let strategy of strategies) {
      try {
        let jsonObj = strategy.func(preFormatString(str));
        let filteredJson = filterJSON(jsonObj, filter);
        const formattedString = formatHighlight(filteredJson, customColorOptions);
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
      if (filter && str.includes(filter)) {
        output += formatRegularString(str) + "\n";
      }
      else if (!filter) {
        output += formatRegularString(str) + "\n";
      }
    }
    output += "<hr>";
  }
  return formatHtml(output);
}

function filterJSON(obj, searchString) {
  if (!searchString) {
    return obj;
  }

  if (typeof obj === "string") {
    const lines = obj.split("\n");
    const matchingLines = lines.filter((line) => line.includes(searchString));
    return matchingLines.length > 0 ? matchingLines.join("\n") : undefined;
  }

  if (Array.isArray(obj)) {
    const newArray = obj
      .map((item) => filterJSON(item, searchString))
      .filter((item) => item !== undefined);
    return newArray.length > 0 ? newArray : undefined;
  }

  if (typeof obj === "object" && obj !== null) {
    const newObj = Object.entries(obj)
      .map(([key, value]) => {
        if (key.includes(searchString)) {
          return [key, value];
        }

        const reducedValue = filterJSON(value, searchString);
        return reducedValue !== undefined ? [key, reducedValue] : undefined;
      })
      .filter((entry) => entry !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    return Object.keys(newObj).length > 0 ? newObj : undefined;
  }

  return undefined;
}


function formatRegularString(str) {
  return str.trimLeft().replace(/\n +/g, "\n");
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

function preFormatString(str) {
  return str
    .replace(/<|>/g, (match) => (match === "<" ? "&lt;" : "&gt;"))
    .replace(/&/g, "&amp;");
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
  if (currentString.length > 1) {
    result.push(currentString);
  }
  return result;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.divRef = React.createRef();
    this.state = {
      filter: "",
    };
  }

  componentDidMount() {
    this.parseClipboard();
  }

  parseClipboard = (filter) => {
    navigator.permissions.query({ name: "clipboard-read" }).then((result) => {
      if (result.state === "granted" || result.state === "prompt") {
        navigator.clipboard.readText().then((text) => {
          let out = prettifyJson(text, filter);
          this.divRef.current.innerHTML = out;
        });
      }
    });
  };

  handleKeyDown = (event) => {
    if (event.key === "Enter") {
      this.parseClipboard(this.state.filter);
    }
  };

  handleChange = (event) => {
    this.setState({ filter: event.target.value });
  };

  render() {
    return (
      <>
        <input
          type="text"
          placeholder="Filter"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          style={{ marginBottom: "1rem" }}
        />
        <pre className="App" ref={this.divRef}></pre>
      </>
    );
  }
}

export default App;
