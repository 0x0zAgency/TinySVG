# TinySVG-JS
A SVG Transpiler designed for Web3.


## Written by Llydia Cross 2021

TinySVG is a SVG transpiler which aims to cut the size of most SVGs in half and also provide more safety over SVG. You can also use it
to make new SVG art using the various create methods.

Its very simple to use, simply put your SVG code into `tinySVG.toTinySVG("<svg>..")` and log the output and take a look, if you just want tinySVG to be returned then
simply pass true as the second argument on the method toTinySVG, like so.
`tinySVG.toTinySVG("<svg>..", true)`

You can also add on functionality via the registerTag method and register your own conversion and parse methods.

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
            colour: "none" //can use helper func getHexFromStyle() to fill this!,
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