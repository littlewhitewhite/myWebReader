var addon = require('bindings')('hello');

console.log(addon.hello()); // 'world'
// console.log(addon.DllFn1());
console.time("zdocument");
// var zimageObj = new  addon.ZImage();
var zDocumentObj = new addon.ZDocument();

console.timeEnd("zdocument");
// var ret = zDocumentObj;
var ret = zDocumentObj.loadDLL();
console.log("loadDLL ret:", ret);
if(ret != 0){
    process.exit(ret);
}
var ret = zDocumentObj.createImage(1);
console.log("ret:", ret);

// var width = zimageObj.getWidth();
// var height = zimageObj.getHeight();
// var dataSize = zimageObj.getDataSize();


// // console.log("width:", width);
// // console.log("height:", height);
// console.log("dataSize in js:", dataSize);

for(var i = 1; i <= 7; i ++){
    var arrayBuffer = zDocumentObj.getPageData(i);
    console.log("size:", arrayBuffer.byteLength, "data:", arrayBuffer, "");
}



