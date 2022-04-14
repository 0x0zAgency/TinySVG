const assert = require("chai").assert;
const tinySVG = require("../src/tinysvg");

describe('tinySVG', () => {
    it("Should have imported sucessfully", () => {
        assert.exists(tinySVG.conversionMethods);
        assert.isNotEmpty(tinySVG.conversionMethods);
        assert.exists(tinySVG.parseMethods);
        assert.isNotEmpty(tinySVG.parseMethods);
    })

    it("Should parse an SVG tag with one path group (no attributes)", () => {
        let result = tinySVG.toTinySVG("<svg><path></path></svg>");
        assert.lengthOf(result, 5);
        assert.isString(result[0]);
        assert.isNumber(result[1]);
        assert.equal(result[1], 1); //should be one path group
    })

    it("Should parse an SVG and the path element should have properties", () => {
        let result = tinySVG.toTinySVG("<svg><path d='test'></path></svg>");
        assert.lengthOf(result, 5);
        assert.isString(result[0]);
        assert.isNumber(result[1]);
        assert.equal(result[1], 1); //should be one path group

        //check that the tag is not empty && exists
        assert.exists(result[4][1]);
        assert.isNotEmpty(result[4][1]);
        //check it has the d key, implicit transform and style key
        assert.hasAllKeys(result[4][1].properties, [
            "d",
            "transform",
            "style"
        ]);
    })

    it("Should parse a selection of valid SVG tags within groups", () => {
        let result = tinySVG.toTinySVG("<svg><path id='one'></path><g id='two'><path id='three'></path><path id='four'></path><circle></circle><rect></rect></g></svg>");
        assert.lengthOf(result, 5);
        assert.isString(result[0]);
        assert.isNumber(result[1]);
        assert.equal(result[1], 5); //should be three path group

        let circleFlag = false;
        let rectFlag = false;
        let pathCount = 0;

        Object.values(result[4]).forEach((value) => {
            switch (value.tag) {
                case "c":
                    circleFlag = true;
                    break;
                case "r":
                    rectFlag = true;
                    break;
                case "p":
                    pathCount++;
                    break;
            }
        })

        assert.equal(circleFlag, true);
        assert.equal(rectFlag, true);
        assert.equal(pathCount, 3);
    });

    it("Should parse colours from fill & style property succesfully", () => {
        let result = tinySVG.toTinySVG("<svg><path id='one' style='fill:#ff'></path><g id='two'><path id='three'></path><path id='four' fill='#f0f'></path></g></svg>");
        assert.lengthOf(result, 5);
        assert.isString(result[0]);
        assert.isNumber(result[1]);
        assert.equal(result[1], 3); //should be three path group

        assert.isNotEmpty(result[2]);
        assert.includeMembers(result[2], ['none', 3855, 255]) //3855 = #f0f 255 = #ff
    });

    it("Should ignore invalid tags", () => {
        let result = tinySVG.toTinySVG("<svg><invalid></invalid><falseTag></falseTag></svg>");
        assert.lengthOf(result, 5);
        assert.isString(result[0]);
        assert.isNumber(result[1]);
        assert.equal(result[1], 0); //should be one path group

        let [svg] = tinySVG.toSVG(result[0]);
        assert.isString(svg);
    })

    it("Should decompress a compressed tinySVG string and turn it into SVG", () => {
        let result = tinySVG.toTinySVG("<svg><path id='one' style='fill:#ff'></path><g id='two'><path id='three'></path><path id='four' fill='#f0f'></path></g></svg>");
        assert.lengthOf(result, 5);
        assert.isString(result[0]);
        assert.isNumber(result[1]);
        assert.equal(result[1], 3); //should be three path group

        let decresult = tinySVG.decompress(result[3]);
        assert.isString(decresult);

        result = tinySVG.toSVG(decresult);
        assert.lengthOf(result,3);
        assert.isString(result[0]);
    })
})