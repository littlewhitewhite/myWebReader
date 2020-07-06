
var addon = require('./build/Release/cajnode.node');
const fs = require('fs');
var Jimp = require('jimp'); 

var zDocumentObj = new addon.ZDocument();
var ret = zDocumentObj.loadDLL();
console.log("loadDLL ret:", ret);
let fileName2 = ".\\data\\1.pdf";
zDocumentObj.init();
zDocumentObj.openFile(fileName2);
let pageCount = zDocumentObj.getPageCount();
console.log("pageCount out:", pageCount);
let pageNumber = 1;// 页码
let nScale = 100; // 缩放
let millisencods = 1000;// 等待时间
let returnValue = zDocumentObj.getImage(pageNumber, nScale, millisencods);
let returnValue2 = zDocumentObj.getImage(pageNumber + 1, nScale, millisencods);
console.log("returnValue:", returnValue);
let  arrayBuffer = zDocumentObj.getPageData(pageNumber);
console.log("arrayBuffer:", arrayBuffer);

fs.writeFile(".\\data\\" + pageNumber + ".jpg", arrayBuffer, function(err){

});
// const image =  Jimp.read 
// (".\\data\\2.png"); 
// // flip function using callback function 
// image.flip(true, true, function(err){ 
//     if (err) throw err; 
// }) 
// .write('..\\data\\flip2.png'); 

var callback = (err) => {
    if (err) throw err;
    console.log('It\'s saved!');
  }

let getTextRetrunValue = zDocumentObj.getText(pageNumber);
console.log("getTextReturnValue:", getTextRetrunValue);

let pageJsonObject = {};
let lineCount = zDocumentObj.getLineCount(pageNumber);

pageJsonObject['pageNumber'] = pageNumber;

console.log("lineCount:", lineCount);
pageJsonObject['lineCount'] = lineCount;

let textLines = [];
for (let j = 0; j < lineCount; j++) {
    let textLineJsonObject = {};
    let charCount = zDocumentObj.getCharCount(pageNumber, j);
    textLineJsonObject["charCount"] = charCount;
    if (charCount <= 0) {
        
        continue;
    }
    let charWidth = zDocumentObj.getCharWidth(pageNumber, j);
    textLineJsonObject["charWidth"] = charWidth;
    console.log("charWidth:", charWidth);
    let xMin = zDocumentObj.getCharXLeft(pageNumber, j, 0);
    let xMax = zDocumentObj.getCharXLeft(pageNumber, j, charCount - 1) + charWidth;
    let yMax = zDocumentObj.getCharYMax(pageNumber, j);
    textLineJsonObject["xMin"] = xMin;
    textLineJsonObject["xMax"] = xMax;
    textLineJsonObject["yMax"] = yMax;
    console.log("xMin:", xMin, "xMax:", xMax, "yMax:", yMax);

    // let xLeft = zDocumentObj.getLineCount(i, j);
    // console.log("xleft:", multiBy(xMin));
    
    var chars = "";
    let charArray = [];
    for(let k = 0; k < charCount; k ++){
        // chars += String.fromCharCode(zDocumentObj.getCharValue(pageNumber, j, k));
        let char = zDocumentObj.getCharValue(pageNumber, j, k);
        charArray.push(char);
        // console.log("char:", char);
    }
    textLineJsonObject["chars"] = charArray;
    textLines.push(textLineJsonObject);
    console.log("chars:", chars);
}
pageJsonObject['textLines'] = textLines;

// console.log("pageJsonObject:", pageJsonObject);
fs.writeFileSync(".\\data\\" + pageNumber + ".json", JSON.stringify(pageJsonObject));

// let getTextRetrunValue2 = zDocumentObj.getText(pageNumber + 1);
// console.log("getTextReturnValue2:", getTextRetrunValue2);
// let lineCount2 = zDocumentObj.getLineCount(pageNumber + 1);
// console.log("lineCount2:", lineCount2);



zDocumentObj.closeFile();