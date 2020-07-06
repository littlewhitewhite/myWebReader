
// const { dialog } = require("electron").remote
// // console.log(dialog);

// const openFileButton = document.getElementById("openFile")
// openFileButton.addEventListener('click', function () {
//     dialog.showOpenDialog({
//         properties:
//             ['openFile'],
//         filters: [
//             { name: "打开文件", extensions: ['pdf', "caj", "kdh"] }
//         ]
//     }).then(result => {
//         if (result.canceled == false) {
//             console.log(result.filePaths);
//             drawPage2(result.filePaths[0]);
//         }
//     }).catch(
//         error => {
//             console.log(error);
//         }
//     )
// })

// var addon = require('bindings')('hello');

// var addon = require('./build/Release/cajnode.node');
// const nativeImage = require('electron').nativeImage;

function multiBy(value) {
    var ratio = 1.333;
    var scale = 1;
    // var scale2 = window.devicePixelRatio;
    var scale2 = 1;
    // console.log("window.devicePixelRatio:", scale2);
    return value * ratio * scale * scale2 / 100.0;
}


function drawText() {
    let requestURL = 'data/page.json';
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'text';
    request.send();
    request.onload = function () {
        let jsonText = request.response;
        // console.log("jsonTextObject", jsonText);
        let jsonTextObject = JSON.parse(jsonText);
        console.log("line_count:", jsonTextObject.line_count);
        let pageSpan = document.getElementById("pageText");
        pageSpan.innerHTML = "";
        let textLines = jsonTextObject.text_lines;
        var c = document.getElementById("pageCanvas");
        var ctx = c.getContext("2d");

        for (let i = 0; i < textLines.length; i++) {
            console.log("i:", i);
            let textLine = textLines[i];
            let spanObject = document.createElement("span");
            console.log("xleft:", multiBy(textLine.x_lefts[0]));
            spanObject.style.left = multiBy(textLine.x_lefts[0]) + "px";
            spanObject.style.top = multiBy(textLine.y_max) + "px";
            spanObject.style.fontSize = multiBy(textLine.char_width) + "px";
            spanObject.style.fontFamily = "serif";
            spanObject.style.transform = "scaleX(1)";
            var chars = "";
            var charsObject = textLine.text_line_text;
            for (let j = 0; j < charsObject.length; j++) {
                chars += String.fromCharCode(charsObject[j]);
            }
            ctx.font = multiBy(textLine.char_width) + "px serif";
            var textWidth = ctx.measureText(chars).width;
            var xLefts = textLine.x_lefts;
            // console.log("xLefts:", xLefts);
            var canvasWidth = xLefts[xLefts.length - 1] - xLefts[0] + textLine.char_width;
            canvasWidth = multiBy(canvasWidth);
            console.log("textWidth:", textWidth, "canvasWidth:", canvasWidth);
            var scaleX = canvasWidth / textWidth;
            console.log("scaleX:", scaleX);
            spanObject.style.transform = "scaleX(" + scaleX + ")";
            spanObject.innerText = chars;
            pageSpan.appendChild(spanObject);
        }
    };
}

function hideNotUsedButton() {
    const needHiddens = [
        "print",
        "download",
        "presentationMode",
        "viewBookmark",
        "secondaryToolbarToggle",
        "toolbarSidebar",
        "findbarOptionsTwoContainer",
        "findbarOptionsOneContainer",
        "scaleSelectContainer"

    ];
    for (const element of needHiddens) {
        document.getElementById(element).style.display = "none";
    }
}

function nextPage() {
    let a = document.createElement("a");
    a.href = "#page=3";
    a.setAttribute("data-page-number", 3);
    a.click();
}

function initViewer() {
    let netPageButton = document.getElementById("next");
    netPageButton.addEventListener("click", nextPage);
}
function drawPage() {
    // hideNotUsedButton();
    // drawText();
    // var canvas = document.getElementById("pageCanvas");
    // var ctx = canvas.getContext("2d");
    console.log("start");
    initViewer();
    let requestURL = 'data/2.json';
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'text';
    request.send();
    request.onload = function () {
        let jsonText = request.response;
        // console.log("jsonTextObject", jsonText);

        // const documentJsonObject = JSON.parse(jsonText);
        const pageCount = 2;
        console.log("pageCount:", pageCount);
        let viewer = document.getElementById("viewer");
        const pagesJsonObject = JSON.parse(jsonText);
        for (let i = 2; i <= pageCount; i++) {
            let pageImg = new Image();
            pageImg.src = "./data/" + i + ".jpg";
            // var current = 60;
            console.log(pageImg.src);
            pageImg.onload = function () {
                let page = document.createElement("div");
                page.className = "page";
                page.setAttribute("data-page-number", i);
                page.style.width = pageImg.width + "px";
                page.style.height = pageImg.height + "px";
                viewer.appendChild(page);

                // if(i == 1)
                {
                    page.setAttribute("data-loaded", true);
                }
                // page.setAttribute("data-loaded", true);
                let pageCanvasWrapper = document.createElement("div");
                pageCanvasWrapper.className = "canvasWrapper";
                pageCanvasWrapper.style.width = pageImg.width + "px";
                pageCanvasWrapper.style.height = pageImg.height + "px";
                page.appendChild(pageCanvasWrapper);

                let pageCanvas = document.createElement("canvas");
                pageCanvas.width = pageImg.width;
                pageCanvas.height = pageImg.height;
                pageCanvas.style.width = pageImg.width + "px";
                pageCanvas.style.height = pageImg.height + "px";
                pageCanvas.setAttribute("aria-label", "页码 " + i);

                pageCanvasWrapper.appendChild(pageCanvas);
                // ctx.rotate(60* Math.PI/180);
                let ctx = pageCanvas.getContext("2d");
                console.log("ctx:", ctx);
                ctx.save();
                // this.style.transform = 'rotate('+current+'deg)'
                // var canvasWidth = pageCanvas.width;
                // console.log("canvasWidth:", canvasWidth);
                var width = pageImg.width;
                console.log("pageWidth:", width);
                var x = 0;
                var y = 0;
                var height = pageImg.height;
                console.log("pageHeight:", height);
                ctx.scale(1, -1);
                // ctx.scale(0.12, -0.12);
                ctx.drawImage(this, x, -height - y, width, height)
                // ctx.drawImage(pageImg, 0, 0);

                //draw text 
                // let jsonTextObject = JSON.parse(jsonText);
                // let textLinesJsonObject = pagesJsonObject[i - 1];

                console.log("lineCount:", pagesJsonObject.lineCount);
                let textLayer = document.createElement("div");
                textLayer.className = "textLayer";
                textLayer.style.width = pageImg.width + "px";
                textLayer.style.height = pageImg.height + "px";
                page.appendChild(textLayer);
                // let pageSpan = document.getElementById("pageText");
                // pageSpan.innerHTML = "";
                let textLines = pagesJsonObject.textLines;
                // var c = document.getElementById("pageCanvas");
                // var ctx = c.getContext("2d");
                for (let j = 0; j < textLines.length; j++) {
                    console.log("j:", j);
                    let textLine = textLines[j];
                    let spanObject = document.createElement("span");
                    console.log("xleft:", multiBy(textLine.xMin));
                    spanObject.style.left = multiBy(textLine.xMin) + "px";
                    spanObject.style.top = multiBy(textLine.yMax) + "px";
                    spanObject.style.fontSize = multiBy(textLine.charWidth) + "px";
                    spanObject.style.fontFamily = "serif";
                    spanObject.style.transform = "scaleX(1)";
                    var chars = "";
                    var charsObject = textLine.chars;
                    for (let k = 0; k < charsObject.length; k++) {
                        chars += String.fromCharCode(charsObject[k]);
                    }
                    ctx.font = multiBy(textLine.charWidth) + "px serif";
                    var textWidth = ctx.measureText(chars).width;
                    // var xLefts = textLine.x_lefts;
                    // let xMin = textLine.xMin;
                    // console.log("xLefts:", xLefts);
                    var canvasWidth =  textLine.xMax - textLine.xMin + textLine.charWidth;
                    canvasWidth = multiBy(canvasWidth);
                    console.log("textWidth:", textWidth, "canvasWidth:", canvasWidth);
                    var scaleX = canvasWidth / textWidth;
                    console.log("scaleX:", scaleX);
                    spanObject.style.transform = "scaleX(" + scaleX + ")";
                    spanObject.innerText = chars;
                    textLayer.appendChild(spanObject);
                }
                ctx.restore();
                // page.appendChild(pageCanvas);

            };
        }
    }

    // var pageImg = new Image();
    // pageImg.src = "./data/a.jpg";

    // // var current = 60;

    // pageImg.onload = function () {
    //     // ctx.rotate(60* Math.PI/180);
    //     ctx.save();
    //     // this.style.transform = 'rotate('+current+'deg)'
    //     var canvasWidth = canvas.width;
    //     console.log("canvasWidth:", canvasWidth);
    //     var width = pageImg.width;
    //     console.log("pageWidth:", width);
    //     var x = 0;
    //     var y = 0;
    //     var height = pageImg.height;
    //     console.log("pageHeight:", height);
    //     ctx.scale(1, -1);
    //     // ctx.scale(0.12, -0.12);
    //     ctx.drawImage(this, x, -height-y, width, height)

    //     ctx.drawImage(this, 0, 0);
    //     ctx.restore();
    // };
    console.log("drawImage end");
}

// let zDocumentObj = new addon.ZDocument();

// class ZPage {
//     constructor(pageNumber, x, y, width, height){
//         this.pageNumber = pageNumber;
//         this.x = x;
//         this.y = y;
//         this.width = width;
//         this.height = height;
//     }
// }

// let g_currentPageNumber = 1;
// let g_zpages = [];

// class ZPDF {

// }

// let ZPDF;


// function initAll() {
//     // zDocumentObj = 
//     // console.timeEnd("zdocument");
//     // var ret = zDocumentObj;
//     hideNotUsedButton();
//     var ret = zDocumentObj.loadDLL();
//     console.log("loadDLL ret:", ret);
//     if (ret != 0) {
//         process.exit(ret);
//     }
//     // drawPage2("");
// }

function setPageNumber(){
    document.getElementById("pageNumber").value = g_currentPageNumber;
}

function calulatePageNumber(){
    let viewerContainerElement = document.getElementById("viewerContainer");
    let scrollTop = viewerContainerElement.scrollTop;
    console.log("scrollTop:", scrollTop);
    let y = 10;
    for(let i = 0; i < g_zpages.length; i ++){
        y += g_zpages[i].height;
        if(scrollTop <= y){
            g_currentPageNumber = i + 1;
            break;
        }
    }
}

function updatePageButton(){
    let previouseButton = document.getElementById("previous");
    let nextButton = document.getElementById("next");
    console.log("g_currentPageNumber:", g_currentPageNumber);
    if(g_currentPageNumber > 1){
        previouseButton.disabled = false;
    }
    if(g_currentPageNumber == 1){
        previouseButton.disabled = true;
    }
    if(g_currentPageNumber == g_zpages.length){
        nextButton.disabled = true;
    }
    if(g_currentPageNumber < g_zpages.length){
        nextButton.disabled = false;
    }
}
function setScrollEvent(){
    let viewerContainerElement = document.getElementById("viewerContainer");
    viewerContainerElement.addEventListener("scroll", function(event){
        console.log("enent scrollTop:", this.scrollTop);
        calulatePageNumber();
        setPageNumber();
        updatePageButton();

    })
}

function setPageButton(){
    let previouseButton = document.getElementById("previous");
    let nextButton = document.getElementById("next");
    nextButton.addEventListener("click", function(){
        calulatePageNumber();
        x = 0;
        y = 10;
        for(let i = 0; i < g_currentPageNumber; i ++){
            y += g_zpages[i].height + 10;
        }
        console.log("y:", y);
        g_currentPageNumber ++;
        setPageNumber();
        let viewerContainerElement = document.getElementById("viewerContainer");
        viewerContainerElement.scrollTo(x, y);
        previouseButton.disabled = false;
        if(g_currentPageNumber == g_zpages.length){
            nextButton.disabled = true;
        }
    });

    previouseButton.addEventListener("click", function(){
        calulatePageNumber();
        x = 0;
        y = 10;
        for(let i = 0; i < g_currentPageNumber - 2; i ++){
            y += g_zpages[i].height + 10;
        }
        console.log("y:", y);
        g_currentPageNumber --;
        setPageNumber();
        let viewerContainerElement = document.getElementById("viewerContainer");
        viewerContainerElement.scrollTo(x, y);
        if(g_currentPageNumber == 0){
            previouseButton.disabled = true;
        }
    });
}


function drawTextLayer(zDocumentObj, pageNumber, page, pageImg, ctx){
    let lineCount = zDocumentObj.getLineCount(pageNumber);
    console.log("lineCount:", lineCount);
    let textLayer = document.createElement("div");
    textLayer.className = "textLayer";
    textLayer.style.width = pageImg.width + "px";
    textLayer.style.height = pageImg.height + "px";
    page.appendChild(textLayer);
    zpage = new ZPage();
    zpage.pageNumber = pageNumber;
    zpage.width = pageImg.width;
    zpage.height = pageImg.height;
    g_zpages.push(zpage);
    for (let j = 0; j < lineCount; j++) {
        let charCount = zDocumentObj.getCharCount(pageNumber, j);
        if (charCount <= 0) {
            continue;
        }
        let charWidth = zDocumentObj.getCharWidth(pageNumber, j);
        console.log("charWidth:", charWidth);
        let xMin = zDocumentObj.getCharXLeft(pageNumber, j, 0);
        let xMax = zDocumentObj.getCharXLeft(pageNumber, j, charCount - 1) + charWidth;
        let yMax = zDocumentObj.getCharYMax(pageNumber, j);

        let spanObject = document.createElement("span");
        // let xLeft = zDocumentObj.getLineCount(i, j);
        console.log("xleft:", multiBy(xMin));
        spanObject.style.left = multiBy(xMin) + "px";
        spanObject.style.top = multiBy(yMax) + "px";
        spanObject.style.fontSize = multiBy(charWidth) + "px";
        spanObject.style.fontFamily = "serif";
        spanObject.style.transform = "scaleX(1)";
        var chars = "";
        for(let k = 0; k < charCount; k ++){
            chars += String.fromCharCode(zDocumentObj.getCharValue(pageNumber, j, k));
        }
        ctx.font = multiBy(charWidth) + "px serif";
        var textWidth = ctx.measureText(chars).width;
        // var textWidth = 200;
        // var xLefts = textLine.x_lefts;
        // console.log("xLefts:", xLefts);
        var canvasWidth = xMax - xMin;
        canvasWidth = multiBy(canvasWidth);
        console.log("textWidth:", textWidth, "canvasWidth:", canvasWidth);
        var scaleX = canvasWidth / textWidth;
        console.log("scaleX:", scaleX);
        spanObject.style.transform = "scaleX(" + scaleX + ")";
        spanObject.innerText = chars;
        textLayer.appendChild(spanObject);
    }
}

function imageOnLoad() {
    let pageCanvasWrapper = document.createElement("div");
    pageCanvasWrapper.className = "canvasWrapper";
    pageCanvasWrapper.style.width = this.width + "px";
    pageCanvasWrapper.style.height = this.height + "px";
    this.page.style.width = this.width + "px";
    this.page.style.height = this.height + "px";
    this.page.appendChild(pageCanvasWrapper);

    let pageCanvas = document.createElement("canvas");
    pageCanvas.width = this.width;
    pageCanvas.height = this.height;
    pageCanvas.style.width = this.width + "px";
    pageCanvas.style.height = this.height + "px";
    pageCanvas.setAttribute("aria-label", "页码 " + this.pageNumber);

    pageCanvasWrapper.appendChild(pageCanvas);
    // ctx.rotate(60* Math.PI/180);
    let ctx = pageCanvas.getContext("2d");
    // console.log("ctx:", ctx);
    ctx.save();
    // this.style.transform = 'rotate('+current+'deg)'
    // var canvasWidth = pageCanvas.width;
    // console.log("canvasWidth:", canvasWidth);
    var width = this.width;
    // console.log("pageWidth:", width);
    var x = 0;
    var y = 0;
    var height = this.height;
    // console.log("pageHeight:", height);
    ctx.scale(1, -1);
    // ctx.scale(0.12, -0.12);
    ctx.drawImage(this, x, -height - y, width, height);
    drawTextLayer(this.zDocumentObj, this.pageNumber , this.page, this, ctx);
    ctx.restore();
}

// function drawPage2(fileName) {
//     let fileName2 = ".\\data\\1.pdf";
//     zDocumentObj.init();
//     zDocumentObj.openFile(fileName2);
//     let pageCount = zDocumentObj.getPageCount();
//     console.log("pageCount:", pageCount);
//     zDocumentObj.closeFile();
//     // return ;
//     let pageCount1 = zDocumentObj.getPageCount(fileName);
//     console.log("pageCount:", pageCount1);
//     g_zpages = [];
//     var ret = zDocumentObj.createImage(fileName, 2);
//     // var ret = zDocumentObj.createImage(fileName, 1);
//     console.log("ret:", ret);

//     let viewer = document.getElementById("viewer");
//     viewer.innerHTML = "";
//     let pageCount = zDocumentObj.getPageCount();
//     let spanpageNumbers = document.getElementById("numPages");
//     spanpageNumbers.textContent =  "/ " +  pageCount.toString();
//     let pageNumberInput = document.getElementById("pageNumber");
//     pageNumberInput.setAttribute("max", pageCount);
//     // pageCount = 1;
//     for (var i = 1; i <= 2; i++) {
//         console.log("i:", i);
//         var arrayBuffer = zDocumentObj.getPageData(i);
//         let nativeImage1 = nativeImage.createFromBuffer(arrayBuffer);
//         console.log("size:", arrayBuffer.byteLength, "data:", arrayBuffer, "");
       
//         let page = document.createElement("div");
//         viewer.appendChild(page);
//         page.setAttribute("data-loaded", true);
//         page.className = "page";
//         page.setAttribute("data-page-number", i);

//         let pageImg = new Image();
//         pageImg.src = nativeImage1.toDataURL();
//         pageImg.page = page;
//         pageImg.pageNumber = i;
//         // var current = 60;
//         // console.log(pageImg.src);
//         pageImg.onload = imageOnLoad;
//         pageImg.zDocumentObj = zDocumentObj;
//         // continue;
//     }
//     // setPageButton();
//     // setScrollEvent();
// }

// document.addEventListener("onload", drawPage);