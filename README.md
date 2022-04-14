# TinySVG

```
npm install tinysvg-js
yarn add tinysvg-js
```

# Usage

### toTinySVG(string|object:svgCode, bool: returnObject, bool: writeColours)
```js
import {tinySVG} from 'tinysvg-js';

let [ data, pathSize, colours, compressed] = tinySVG.toTinySVG(`
<svg id="eihepFv6fnS1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 524.9 274.688" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
    <path d="M1.438897,10.358418L0.5,35.23919c112.25619,93.33457,376.72295,214.61628,477.89856,238.94928l4.69448-19.71684L1.438897,10.358418Z" transform="matrix(-1 0 0 1 525.4-4.56316)" fill="#800000" stroke="#000"/>
    <path d="M1.438897,9.88897C141.71843,124.29882,393.13787,225.22368,483.5625,254.00218l40.37256-67.13113C361.26882,110.35993,180.66139,43.74209,13.644558,0.5C7.69821,2.377794,3.629657,5.507451,1.438897,9.88897Z" transform="matrix(-1 0 0 1 525.373948 0)" fill="#f00" stroke="#000"/>
</svg>
`);

console.log(data); //microsvg code
console.log(pathSize); //used with InfinityMint & colours
console.log(colours); //list of colours
console.log(compressed); //compressed LZString (Upload this to the blockchain!)
```

#### Note!
The path size is used for randomised colour generation inside of the InfinityMint smart contract and thus is only really neccessary for that particular function. It should the same as the length of the list of colours returned from the toTinySVG method. **You might need to store your tinySVG along with your colours if you are not writing the colours to the outputted tinySVG**

### toSVG(string|object: tinySVG, bool: headerHasProperties, any[]: colours, bool: skipSVGTag, bool: noneToBlack )

```js
import {tinySVG} from "tinysvg-js"


let [result, pathSize, colours] =
//you can also put compressed (<...>) tinySVG into here as well!
tinySVG.toSVG(`/h[viewbox$*|start]&p[d$*|transform$*|style$fill:#ff]&g[transform$*|id$two|start]&p[d$*|transform$*|style$*]&p[d$*|transform$*|style$*]&g[end]&h[end]`)

console.log(result); //svg code
console.log(pathSize); //path size (explained previous paragraph)
console.log(colours); //drawn colours (explained previous paragraph)
```


# Advanced Usage

## Creating SVG's Programatically

[TUTORIAL COMING SOON]

## Defining Custom Tags

Heres a quick rundown on parse and conversion methods. Conversion methods are used when taking SVG to tinySVG, and parseMethods are for returning tinySVG
back to SVG. It does this by matching the SVG tag to the conversion method via its tag name. We define new conversion methods by using the lowercase SVG/HTML tag name,
for example:

```js
//svg tag
    svg: (properties) => {
        let obj = {
            tag: "h",
            properties: {
                viewbox: properties["viewbox"] || "",
            },
        };

        return this.insertIfPresent(obj, properties, ["id"]);
    },
```

What we must return is a javascript object which tells tinySVG more about this tag, we can use various helper functions to grab colour and properties which are
present and we can use this codeblock to throw any errors if missing data and such. Right now its extremely open as most SVG will work with no attributes. Its up to you
how anal you want to get. Here's a demonstration of using this to define your own SVG tag.

```js
let obj = {
            tag: "mytag", //the tinySVG tag (must match parseMethod), all tags are lowercase so radialGradient will become radialgradiant
            colour: "none", //can use helper func getHexFromStyle() to fill this!
            properties: {
                d: properties["d"] || "", //properties are HTML/SVG attributes
                transform: properties["transform"] || "",
                style: properties["style"] || "",
            },
        };
```

Now when tinySVG sees the tag `<mytag></mytag>` inside SVG code it will read it and parse it!
This is where things can get interesting, since mytag isn't a conventional SVG tag we can register a new parseMethod and actually make it a real SVG tag!

Here is an example.


```js
parseMethods["mytag"] = (properties) => {

    return ["rect", {
        w: properties["width"] || properties["w"] || 10 //will equate to w='value' in SVG attribute
        h: properties["height"] || properties["h"] || 10,
        x: properties["x"] || properties["x"] || 10,
        y: properties["y"] || properties["y"] || 10,
    }, "This is a very special box!"]
}
```

Now, if we were to throw the output of toTinySVG into toSVG a custom rect tag will have been created. The first index of the return array specifies the valid SVG tag
it will be, then the second argument are the HTML/SVG attributes and the third is an optional content field which can also include HTML/SVG its self.

You can use `registerTag(conversionMethod, parseMethod)` to register new tags.

An example.


```js
tinySVG.registerTag(["mytag", (properties) => {
    return {
        tag: "mytag",
        colour: "black", //could use tinySVG.getHexFromStyle(properties)
        properties: {...properties}
    }
}], ["mytag", (properties) => {
    return ["rect", tinySVG.collapseProperties(properties), "My Special Rectangle"]
}])

//then lets create one
let tag = tinySVG.createElement("mytag")
console.log(tag)

//put it back into SVG
console.log(tinySVG.toSVG(tag));
```

## Tests

Testing can be done using mocha.

```npm run test```

```mocha```

## Building

Building is required to use this module.

```npm run build```

It might be frequired to generate types yourself via the following.

```tsc```
# Credits

Written by Llydia Cross 2021

0x0zAgency - Speedrunning the Metaverse