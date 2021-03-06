const { parse } = require("svg-parser");
const LZString = require("lz-string");

/**
 * Written by Llydia
 */
const tinySVG = new (class {
    stack = []; //used with groups (tags with children)
    stackPosition = 0;
    conversionData = [];
    parseData = {};

    //wiped after every parse/conversion method call
    settings = {};

    /**
     * Here you can add your implentations for more tags
     * (the methods in here are called before using .bind(this) inside of this class)
     */

    conversionMethods = {
        text: (properties) => {
            let obj = {
                tag: "t",
                properties: {
                    style: properties["style"] || "*",
                },
            };

            return this.insertIfPresent(obj, properties, ["id"]);
        },
        polygon: (properties) => {
            let colour = this.getHexFromStyle(properties);
            let obj = {
                tag: "poly",
                colour: colour,
                properties: {
                    points: properties["points"] || "*",
                },
            };

            obj = this.cleanFillAndStyle(colour, obj, properties);

            return this.insertIfPresent(obj, properties, ["id", "pathLength"]);
        },
        textpath: (properties) => {
            let obj = {
                tag: "tp",
                properties: {
                    style: properties["style"] || "*",
                    href: properties["href"] || "*",
                },
            };

            return this.insertIfPresent(obj, properties, [
                "id",
                "startOffset",
                "spacing",
                "textLength",
                "side",
                "method",
            ]);
        },
        //svg tag
        svg: (properties) => {
            let obj = {
                tag: "h",
                properties: {
                    viewbox: properties["viewbox"] || "*",
                },
            };

            return this.insertIfPresent(obj, properties, ["id"]);
        },
        path: (properties) => {
            let colour = this.getHexFromStyle(properties);
            let obj = {
                tag: "p",
                colour: colour,
                properties: {
                    d: properties["d"] || "*",
                    transform: properties["transform"] || "*",
                    style: properties["style"] || "*",
                },
            };

            obj = this.insertIfPresent(obj, properties, [
                "fill-rule",
                "stroke",
                "clip-rule",
                "id",
            ]);

            obj = this.cleanFillAndStyle(colour, obj, properties);

            return obj;
        },
        circle: (properties) => {
            let colour = this.getHexFromStyle(properties);
            let obj = {
                tag: "c",
                colour: colour,
                properties: {
                    cx: properties["cx"] || "*",
                    cy: properties["cy"] || "*",
                    r: properties["r"] || "*",
                },
            };

            obj = this.cleanFillAndStyle(colour, obj, properties);

            return this.insertIfPresent(obj, properties, ["style", "id"]);
        },
        ellipse: (properties) => {
            let colour = this.getHexFromStyle(properties);
            let obj = {
                tag: "e",
                colour: colour,
                properties: {
                    cx: properties["cx"] || "*",
                    cy: properties["cy"] || "*",
                    rx: properties["rx"] || "*",
                    ry: properties["ry"] || "*",
                },
            };

            obj = this.cleanFillAndStyle(colour, obj, properties);

            return this.insertIfPresent(obj, properties, ["style", "id"]);
        },
        rect: (properties) => {
            let colour = this.getHexFromStyle(properties);
            let obj = {
                tag: "r",
                colour: colour,
                properties: {
                    w: properties["w"] || "*",
                    h: properties["h"] || "*",
                    x: properties["x"] || "*",
                    y: properties["y"] || "*",
                },
            };

            obj = this.cleanFillAndStyle(colour, obj, properties);

            return this.insertIfPresent(obj, properties, ["style", "id"]);
        },
        g: (properties) => {
            let obj = {
                tag: "g",
                colour: this.getHexFromStyle(properties),
                properties: {
                    transform: properties["transform"] || "*",
                    id: properties["id"] || "*",
                },
            };

            return this.insertIfPresent(obj, properties, [
                "fill-rule",
                "stroke",
                "clip-path",
                "clip-rule",
                "stroke-miterlimit",
                "style",
            ]);
        },
        defs: (properties) => {
            return {
                tag: "defs",
                properties: {
                    id: properties["id"] || "*",
                },
            };
        },
        lineargradient: (properties) => {
            let obj = {
                tag: "lg",
                properties: {
                    id: properties["id"] || "*",
                    gradientUnits: properties["gradientunits"] || "*",
                    x1: properties["x1"] || "*",
                    x2: properties["x2"] || "*",
                    y1: properties["y1"] || "*",
                    y2: properties["y2"] || "*",
                    "xlink:href": properties["xlink:href"] || "*",
                },
            };

            return obj;
        },
        radialgradient: (properties) => {
            let obj = {
                tag: "rg",
                properties: {
                    id: properties["id"] || "*",
                    gradientUnits: properties["gradientunits"] || "*",
                    cy: properties["cy"] || "*",
                    cx: properties["cx"] || "*",
                    r: properties["r"] || "*",
                    gradientTransform: properties["gradienttransform"] || "*",
                    "xlink:href": properties["xlink:href"] || "*",
                },
            };

            return obj;
        },
        stop: (properties) => {
            let obj = {
                tag: "s",
                properties: {
                    offset: properties["offset"] || "*",
                    style: properties["style"] || "*",
                },
            };

            return this.insertIfPresent(obj, properties, ["id", "stop-colour"]);
        },
        clippath: (properties) => {
            let obj = {
                tag: "cp",
                colour: this.getHexFromStyle(properties),
                properties: {
                    d: properties["d"] || "*",
                },
            };

            return this.insertIfPresent(obj, properties, [
                "id",
                "clipPathUnits",
            ]);
        },
    };

    //used when parsing tinySVG
    parseMethods = {
        //tag
        h: (properties) => {
            return ["svg", this.collapseProperties(properties)];
        },
        p: (properties) => {
            console.log(properties);
            return ["path", this.collapseProperties(properties)];
        },
        g: (properties) => {
            return ["g", this.collapseProperties(properties)];
        },
        c: (properties) => {
            return ["circle", this.collapseProperties(properties)];
        },
        rect: (properties) => {
            return ["rect", this.collapseProperties(properties)];
        },
        poly: (properties) => {
            return ["polygon", this.collapseProperties(properties)];
        },
        t: (properties) => {
            return ["text", this.collapseProperties(properties)];
        },
        tp: (properties) => {
            return ["textPath", this.collapseProperties(properties)];
        },
        defs: (properties) => {
            return ["defs", this.collapseProperties(properties)];
        },
        cp: (properties) => {
            return ["clipPath", this.collapseProperties(properties)];
        },
        s: (properties) => {
            return ["stop", this.collapseProperties(properties)];
        },
        lg: (properties) => {
            return ["linearGradient", this.collapseProperties(properties)];
        },
        rg: (properties) => {
            return ["radialGradient", this.collapseProperties(properties)];
        },
        e: (properties) => {
            return ["ellipse", this.collapseProperties(properties)];
        },
    };

    /**
     *
     * @param {object} properties
     * @returns
     */
    collapseProperties(properties) {
        if (properties === null) return null;

        let parameters = " ";
        for (let [index, value] of Object.entries(properties)) {
            if (value === null) continue;

            parameters += `${this.tryDecodeURI(index)}="${this.tryDecodeURI(value) === ""
                    ? value
                    : this.tryDecodeURI(value)
                }" `;
        }
        return parameters;
    }

    cleanFillAndStyle(colour, obj, properties) {
        //if the fill is set and undefined and for some reason the style has a fill none in it, remove it
        if (properties.fill !== undefined && obj.properties.style !== undefined)
            //can fix invisible lines
            obj.properties.style = obj.properties.style
                .trim()
                .replace("fill:none;", "");

        if (obj.properties.style !== undefined)
            //potential end of string css tag
            obj.properties.style = obj.properties.style.replace("fill:none", "");

        if (
            properties.fill !== undefined &&
            obj.properties.fill !== "*" &&
            parseInt(properties.fill.substr(1)) === colour
        )
            delete obj.properties.fill;

        return obj;
    }

    /**
     *
     * @param {object} obj
     * @param {object} properties
     * @param {Array} values
     * @returns
     */
    insertIfPresent(obj, properties, values) {
        values.forEach((value) => {
            if (
                properties[value.toLowerCase()] !== undefined &&
                properties[value.toLowerCase()] !== null &&
                properties[value.toLowerCase()] !== ""
            )
                obj[value] = properties[value.toLowerCase()];
        });

        return obj;
    }

    /**
     * Register's a new tinySVG tag, conversion method is what is put into tinySVG. parseMethod is what is read and turned into SVG.
     * First argument can either be an object or an array
     * 	["tag", (properties) => {return {} }]
     * 	{tag: (properties) => {return {} }}
     *
     * @param {object|Array} conversionMethod
     * @param {object|Array} parseMethod
     */
    registerTag(conversionMethod, parseMethod) {
        let key;
        let callable;

        if (conversionMethod instanceof Array) {
            key = conversionMethod[0];
            if (typeof conversionMethod[1] !== "function")
                throw new Error("Value must be callable");

            callable = conversionMethod[1];
        } else if (typeof conversionMethod === "object") {
            key = Object.keys(conversionMethod)[0];
            let vals = Object.values(conversionMethod);

            if (typeof vals[0] !== "function")
                throw new Error("Value must be callable");

            callable = vals[0];
        } else
            throw new Error(
                "bad type for parseMethod should be object or instance of Array"
            );

        if (
            (typeof key !== "string" && typeof key !== "number") ||
            this.conversionMethods[key] !== undefined
        )
            throw new Error("bad key: " + key);

        this.conversionMethods[key] = callable;

        //now do parseMethod

        if (parseMethod instanceof Array) {
            key = parseMethod[0];
            if (typeof parseMethod[1] !== "function")
                throw new Error("Value must be callable");

            callable = parseMethod[1];
        } else if (typeof conversionMethod === "object") {
            key = Object.keys(conversionMethod)[0];
            let vals = Object.values(parseMethod);

            if (typeof vals[0] !== "function")
                throw new Error("Value must be callable");
            callable = vals[0];
        } else
            throw new Error(
                "bad type for parseMethod should be object or instance of Array"
            );

        if (
            (typeof key !== "string" && typeof key !== "number") ||
            this.parseMethods[key] !== undefined
        )
            throw new Error("bad key: " + key);
    }

    /**
     * Creates a new tinySVG element, this can then be fed into toSVG() to be parsed into valid SVG.
     * @param {string} tinySVGTagName
     * @param {object} properties
     * @param {bool} returnObject
     * @returns
     */
    createElement(
        tinySVGTagName,
        properties = {},
        content = "",
        returnObject = true
    ) {
        tinySVGTagName = tinySVGTagName.toLowerCase();
        if (this.parseMethods[tinySVGTagName] === undefined)
            throw new Error("tinySVG tag is not defined: " + tinySVGTagName);

        let obj = {
            tag: tinySVGTagName,
            colour: this.getHexFromStyle(properties),
            properties: { ...properties },
        };

        if (content !== "") obj.content = content;

        if (returnObject) return obj;

        return [obj];
    }

    /**
     *
     * @param {string} svgCode
     * @param {bool} returnObject
     * @param {bool} writeColours
     * @returns
     */
    toTinySVG(
        svgCode,
        returnObject = false,
        writeColours = false,
        convertColoursToNumber = true
    ) {
        let hastObject;
        try {
            hastObject = parse(svgCode);
        } catch (error) {
            console.log(error);
            throw new Error("Invalid SVG");
        }

        this.settings = {
            convertToNumber: convertColoursToNumber,
        };

        this.stack = [];
        this.conversionData = [];

        let recursive = (children) => {
            children.forEach((value, index) => {
                if(value === undefined || value === null || value.tagName === undefined){
                    return;
                }

                //lower case all keys
                if (value.properties === undefined)
                    value.properties = {};
                for (let [propertyIndex, propertyValue] of Object.entries(
                    value.properties
                )) {
                    delete value.properties[propertyIndex];
                    value.properties[
                        typeof propertyIndex === "string"
                            ? propertyIndex
                                .toLowerCase()
                                .replace(/~/g, ":") //not sure why i do this
                                .replace(/|/g, "")
                            : propertyIndex
                    ] =
                        typeof propertyValue === "string"
                            ? //not sure why i do this
                            propertyValue.replace(/~/g, ":")
                            : propertyValue;
                }

                //skip undefined tag
                if ( this.conversionMethods[value.tagName.toLowerCase()] ===
                    undefined
                ) {
                    console.log(
                        "unsupported tag: " + value.tagName.toLowerCase()
                    );
                    return;
                }

                console.log("test");

                if (
                    value.children !== undefined &&
                    value.children.length !== 0
                ) {
                    let obj = {
                        ...this.conversionMethods[
                            value.tagName.toLowerCase()
                        ].bind(this, value.properties)(),
                    };
                    this.conversionData.push({ ...obj, startTag: true });
                    this.stack.push({
                        ...obj,
                        ...(recursive(value.children) || {}),
                    });
                } else
                    this.conversionData.push(
                        this.conversionMethods[
                            value.tagName.toLowerCase()
                        ].bind(this, value.properties)()
                    );

                if (this.stack.length > 0)
                    this.conversionData.push({
                        ...this.stack.pop(),
                        endTag: true,
                    });
            });
        };

        //will fill conversionData with attributes
        recursive(hastObject.children || hastObject);

        //stack should be zero
        if (this.stack.length !== 0)
            console.log("WARNING: stack is not zeroed");

        let result = {
            map: { ...this.conversionData },
        };

        result.pathSize = this.countPathTags(result.map);
        result.colours = this.selectColours(result.map);
        result.paths = this.buildMap(result.map);
        result.compressed = this.compress(result.paths);

        if (returnObject) return { ...result };
        return [
            result.paths,
            result.pathSize,
            result.colours,
            result.compressed,
            result.map,
        ];
    }

    /**
     *
     * @param {object} element
     * @param {Array|object} map
     * @param {bool} belowFirstElement
     */

    insertElement(element, map, belowFirstElement) {
        if (typeof element !== "object" || element instanceof Array)
            throw new Error("invalid parameter");

        this.insertMap(element, map, belowFirstElement);
    }

    /**
     * Inserts a map into another map, can also insert an element! third argument specifies if to insert it below the first tag or after the first tag.
     * If you don't care about this you can just use JS syntax to unpack
     * eg: [...mapOne, ...mapTwo] or [...mapTwo, ...mapOne]
     * @param {*} values
     * @param {*} map
     * @param {*} belowFirstElement
     * @returns
     */

    insertMap(values, map, belowFirstElement = true) {
        if (map instanceof Array === false) map = Object.values(map);

        if (values instanceof Array === false) values = [{ ...values }];

        let result = [];
        if (belowFirstElement) {
            result = [map[0], ...values, ...map.splice(1)];
        } else {
            result = [
                ...map.splice(0, map.length - 1),
                ...values,
                ...map.splice(map.length - 1, -1),
            ];
        }

        return result;
    }

    /**
     *
     * @param {string} value
     * @returns
     */
    tryDecodeURI(value) {
        try {
            return decodeURI(value);
        } catch (error) {
            return ""; //return no value
        }
    }

    /**
     * Turns tinySVG into SVG code. Use parseMap to return the map instead. Colours must be passed as third argument.
     * @param {object|Array|string} tinySVG
     * @param {bool} headerHasProperties
     * @param {Array} svgColours
     * @param {bool} skipSVGTag
     * @param {bool} noneToBlack
     * @param {bool} forceColours
     * @returns
     */
    toSVG(
        tinySVG,
        headerHasProperties = true,
        colours = [],
        skipSVGTag = false,
        noneToBlack = false,
        forceColours = true
    ) {

        let map;
        let pathCount = 0;
        let svgColours = [...colours].reverse();

        if (tinySVG instanceof Array === true) map = tinySVG;
        else if (typeof tinySVG === "object")
            map = tinySVG.paths || tinySVG.map || tinySVG;
        //convert from string to map
        else if (typeof tinySVG === "string") {
            map = this.readTinySVG(tinySVG);
        }

        let result = "";
        let reversedMap = Object.values(map).reverse();

        while (reversedMap.length > 0) {
            let task = reversedMap.pop();
            let string;
            let contents;
            let tag = task.tag;
            if (this.parseMethods[task.tag] === undefined) string = ``;
            else {
                //get the tag
                [tag] = this.parseMethods[task.tag].bind(this, null)();

                //if the fill is null or the fill is not just a colour and actually a unique fill then
                //use it, else pop from the colours stack if possible
                if (
                    this.isColourTag(tag) &&
                    (forceColours ||
                        task.properties["fill"] === undefined ||
                        task.properties["fill"] === null) &&
                    svgColours.length > 0
                ) {
                    let result = svgColours.pop();
                    if (typeof result === "number" || !isNaN(result))
                        result = this.toHexFromDecimal(result);

                    task.properties["fill"] = result;
                }

                if (this.isPathTag(tag)) pathCount++;

                //if we are turning none to black
                if (
                    this.isColourTag(tag) &&
                    (task.properties["fill"] === undefined ||
                        task.properties["fill"] === "none" ||
                        task.properties["fill"] === null) &&
                    noneToBlack
                )
                    task.properties["fill"] = "black";

                if ((tag === "svg" || task === "h") && !headerHasProperties)
                    task.properties = {};

                if ((tag === "svg" || task === "h") && skipSVGTag) continue;

                let parseResult = this.parseMethods[task.tag].bind(
                    this,
                    task.properties
                )();
                [tag, string, contents] = parseResult;
            }

            if (task.endTag) result += `</${tag}>`;
            else {
                if (
                    (task.contents !== undefined && task.contents !== null) ||
                    (contents !== undefined && contents !== null)
                ) {
                    result +=
                        `<${tag}${string}>${task.contents}${contents}` +
                        (task.startTag === true ? "" : `</${tag}>`);
                } else
                    result += `<${tag}${string}${task.startTag === true ? "" : "/"
                        }>`;
            }
        }

        return [result, pathCount, svgColours];
    }

    /**
     *
     * @param {string} potentialMap
     * @returns
     */
    readTinySVG(potentialMap) {
        if (potentialMap.indexOf("<svg") !== -1)
            throw new Error("Please enter tiny SVG");

        if (potentialMap.substring(0, 1) === "<")
            potentialMap = this.decompress(potentialMap);

        if (potentialMap.substring(0, 1) !== "/")
            throw new Error("Please enter tiny SVG");

        potentialMap = potentialMap.substring(1);
        let keys = potentialMap.split("&");
        let map = [];

        keys.forEach((key) => {
            let properties = key.match(/\[(.*?)\]/);
            let obj = {};
            if (
                properties === null &&
                (key.indexOf("[") === -1 || key.indexOf("]") === -1)
            ) {
                obj.tag = key.replace(/\[/g, "").replace(/\]/g, "");
            } else {
                obj.tag = key.substring(0, key.indexOf("["));
            }

            obj.properties = {};

            properties = properties[1].split("|");
            properties.forEach((property) => {
                if (property === "end") {
                    obj.endTag = true;
                    return;
                }
                if (property === "start") {
                    obj.startTag = true;
                    return;
                }
                if (property.indexOf("$") === -1)
                    obj.properties[Object.keys(obj.properties).length] =
                        property;
                else {
                    let splitProperty = property.split("$");
                    let val = splitProperty[1] || null;
                    if (val !== null) val = val.replace(/~/g, ":");
                    if (val === "*" || val.length === 0) val = null;
                    obj.properties[
                        (splitProperty[0] || "").replace(/~/g, ":")
                    ] = val;
                }
            });

            map.push(obj);
        });

        return { ...map };
    }

    /**
     *
     * @param {string} paths
     * @returns
     */
    decompress(paths) {
        return LZString.decompressFromEncodedURIComponent(
            paths.match(/<(.*?)>/)[1]
        );
    }

    /**
     *
     * @param {string|object} object
     * @returns
     */
    compress(object) {
        let paths;
        if (typeof object === "object")
            paths =
                object.paths ||
                this.buildMap(object.map) ||
                this.buildMap(object);
        else paths = object;

        return `<${LZString.compressToEncodedURIComponent(paths)}>`;
    }

    /**
     *
     * @param {*} tag
     * @param {*} keys
     * @returns
     */
    isColourTag(
        tag,
        keys = [
            "path",
            "circle",
            "rect",
            "p",
            "c",
            "r",
            "ellipse",
            "poly",
            "polygon",
            "e",
        ]
    ) {
        return keys.filter((val) => val === tag).length !== 0;
    }

    /**
     *
     * @param {*} tag
     * @param {*} keys
     * @returns
     */
    isPathTag(
        tag,
        keys = [
            "path",
            "circle",
            "rect",
            "p",
            "c",
            "r",
            "ellipse",
            "poly",
            "polygon",
            "e",
        ]
    ) {
        return keys.filter((val) => val === tag).length !== 0;
    }

    /**
     *
     * @param {*} map
     * @returns
     */
    selectColours(map) {
        let colours = [];
        for (let [index, value] of Object.entries(map)) {
            if (this.isColourTag(value.tag))
                colours.push(value.colour || "none");
        }
        return colours;
    }

    /**
     * Produces a perfect CSS colour code each time
     * @param {number} decimal
     * @returns
     */

    toHexFromDecimal(decimal) {
        decimal = parseInt(decimal).toString(16);

        if (
            decimal.length % 3 !== 0 &&
            decimal.length < 6 &&
            decimal.length !== 4
        )
            decimal = "0" + decimal;

        decimal = decimal.substring(0, 6);

        return "#" + decimal;
    }

    /**
     *
     * @param {*} map
     * @returns
     */
    buildMap(map) {
        let str = `/`;
        for (let [index, value] of Object.entries(map)) {
            str +=
                (value.tag || "u") +
                `[${value.endTag !== true
                    ? this.buildProperties(value.properties || {})
                    : "end"
                }${value.startTag === true ? "|start" : ""}]&`;
        }

        return str.substring(0, str.length - 1);
    }

    /**
     *
     * @param {*} properties
     * @returns
     */
    buildProperties(properties) {
        let result = "";
        for (let [name, value] of Object.entries(properties)) {
            result += `${encodeURI(
                typeof name === "string"
                    ? name.replace(/["'/\\<>`]/g, "")
                    : name
            )}$${encodeURI(
                typeof value === "string"
                    ? value.replace(/["'/\\<>`]/g, "")
                    : value
            )}|`;
        }

        return result.substring(0, result.length - 1);
    }

    /**
     * Gets the colour of an SVG element from its style or fill tag
     * @param {object} properties
     * @param {bool} convertToNumber
     * @returns
     */
    getHexFromStyle(properties, convertToNumber = false) {
        let potentialHex = properties.fill || properties.style;

        if (potentialHex === undefined)
            return "none";

        let result;
        //is already a hex
        if (potentialHex.substring(0, 1) === "#")
            result =
                convertToNumber || this.settings.convertToNumber
                    ? parseInt(properties.fill.substring(1, 7), 16)
                    : potentialHex;
        else {
            if (potentialHex.indexOf("fill:") === -1) return "none";

            let split = potentialHex.split("fill:")[1];

            if (split.indexOf(";") !== -1) split = split.split(";")[0];

            if (split.length > 7 || split.indexOf("#") === -1) return "none";
            else
                result =
                    convertToNumber || this.settings.convertToNumber
                        ? parseInt(split.substring(1, 7), 16)
                        : split;
        }

        return result;
    }

    /**
     *
     * @param {*} map
     * @returns
     */
    countPathTags(map) {
        let count = 0;
        for (let [index, value] of Object.entries(map)) {
            if (this.isPathTag(value.tag)) count++;
        }
        return count;
    }
})();

module.exports = tinySVG;
