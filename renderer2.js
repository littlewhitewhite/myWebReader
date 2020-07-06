// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
// var remote = require('electron').remote;
// const nativeImage = require('electron').nativeImage

// const image = nativeImage.createFromPath('HNZK20200202000-1.jpg')
// console.log(image)

// const fs = require('fs-jetpack');
// // var electronDialog = remote.dialog;

// // var fs = require('fs');
// var Canvas = require('canvas');
// var Image = Canvas.Image;

// var filename = 'HNZK20200202000-1.jpg';
// var data = fs.readFileSync(filename);
// console.log("data:", data)
// var canvas = document.getElementById("piccanvas1");
// var ctx = canvas.getContext("2d")
// var img = new Image;
// img.src = data;
// ctx.drawImage(img);

// function load() {
//     var img = new Image;
//     img.onload = function() {
//         process.nextTick(load);
//         global.gc();
//     };
//     img.src = data;
// }

// load();


const {dialog} = require("electron").remote
console.log(dialog);

const openFileButton = document.getElementById("openFile")
openFileButton.addEventListener('click', function() {
    dialog.showOpenDialog({
        properties:
            ['openFile'],
        filters:[
            {name:"PDF", extensions:['pdf', "PDF"]}
        ]
        }).then(result=>{
        if(result.canceled == false){
            console.log(result.filePaths);
        }
    }).catch(
        error=>{
            console.log(error);
        }
    )
})



var addon = require('bindings')('hello');
const ImageJS = require("imagejs");

// console.log(addon.hello()); // 'world'
// console.log(addon.DllFn1());

console.time("zimage");
var zimageObj = new  addon.ZImage();
console.timeEnd("zimage");
console.time("loadDLL");
zimageObj.loadDLL();
console.timeEnd("loadDLL");
var pageNum = 1;

function drawImage()
{
    console.time("drawImage");
    console.time("createImage");
    console.log("pageNum:", pageNum);
    var ret = zimageObj.createImage(pageNum ++); 

    console.log("ret:", ret);
    console.timeEnd("createImage");
    
    // var width = zimageObj.getWidth();
    // var height = zimageObj.getHeight();
    var dataSize = zimageObj.getDataSize();
    
    // function arrayBufferToBufferCycle(ab) {
    //     var buffer = Buffer.alloc(ab.byteLength);
    //     var view = new Uint8Array(ab);
    //     for (var i = 0; i < buffer.length; ++i) {
    //         buffer[i] = view[i ];
    //     }
    //     return buffer;
    //   }
    
    // console.log("width:", width);
    // console.log("height:", height);
    // console.log("dataSize in js:", dataSize);
    
    var arrayBuffer = zimageObj.getData();
    // console.log("data:", arrayBuffer);
    
    const nativeImage = require('electron').nativeImage;
    
    // let image = nativeImage.createFromPath('data\\1-2.jpg');
    // var buffer = arrayBufferToBufferCycle(arrayBuffer);
    
    let image = nativeImage.createFromBuffer(arrayBuffer);
    // console.log(image.toDataURL())
    document.getElementById("page-1").src = image.toDataURL();
    console.timeEnd("drawImage");
}

document.getElementById("draw").onclick = drawImage;