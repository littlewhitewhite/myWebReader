
const { dialog } = require("electron").remote
// console.log(dialog);
var fs = require('fs');

const openFileButton = document.getElementById("openFile")
openFileButton.addEventListener('click', function () {
    dialog.showOpenDialog({
        properties:
            ['openFile'],
        filters: [
            { name: "打开文件", extensions: ['pdf', "caj", "kdh"] }
        ]
    }).then(result => {
        if (result.canceled == false) {
            console.log(result.filePaths);
            drawPage2(result.filePaths[0]);
           // ParseXML("C:\\Users\\LC\\Desktop\\notes.xml");
        }
    }).catch(
        error => {
            console.log(error);
        }
    )
})

var addon = require('./build/Release/cajnode.node');
const nativeImage = require('electron').nativeImage;

function multiBy(value) {
    var ratio = 1.333;
    var scale = 1;
    var scale2 = window.devicePixelRatio;
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
       // "print",
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
/*
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
*/
function drawPage() {
    // hideNotUsedButton();
    // drawText();
    // var canvas = document.getElementById("pageCanvas");
    // var ctx = canvas.getContext("2d");
    initViewer();
    let requestURL = 'data/page.json';
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'text';
    request.send();
    request.onload = function () {
        let jsonText = request.response;
        // console.log("jsonTextObject", jsonText);
        const documentJsonObject = JSON.parse(jsonText);
        const pageCount = documentJsonObject["page_count"];
        console.log("pageCount:", pageCount);
        let viewer = document.getElementById("viewer");
        const pagesJsonObject = documentJsonObject["pages"];
        for (let i = 1; i <= pageCount; i++) {
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
                let textLinesJsonObject = pagesJsonObject[i - 1];

                console.log("line_count:", textLinesJsonObject.line_count);
                let textLayer = document.createElement("div");
                textLayer.className = "textLayer";
                textLayer.style.width = pageImg.width + "px";
                textLayer.style.height = pageImg.height + "px";
                page.appendChild(textLayer);
                // let pageSpan = document.getElementById("pageText");
                // pageSpan.innerHTML = "";
                let textLines = textLinesJsonObject.text_lines;
                // var c = document.getElementById("pageCanvas");
                // var ctx = c.getContext("2d");
                for (let j = 0; j < textLines.length; j++) {
                    console.log("j:", j);
                    let textLine = textLines[j];
                    let spanObject = document.createElement("span");
                    console.log("xleft:", multiBy(textLine.x_lefts[0]));
                    spanObject.style.left = multiBy(textLine.x_lefts[0]) + "px";
                    spanObject.style.top = multiBy(textLine.y_max) + "px";
                    spanObject.style.fontSize = multiBy(textLine.char_width) + "px";
                    spanObject.style.fontFamily = "serif";
                    spanObject.style.transform = "scaleX(1)";
                    var chars = "";
                    var charsObject = textLine.text_line_text;
                    for (let k = 0; k < charsObject.length; k++) {
                        chars += String.fromCharCode(charsObject[k]);
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

let zDocumentObj = new addon.ZDocument();

class ZPage {
    constructor(pageNumber, x, y, width, height){
        this.pageNumber = pageNumber;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

let g_currentPageNumber = 1;
let g_zpages = [];

var CAJAnnotateBar = {
    opened : false,
    openAnnotateBar : function() {
        if(!CAJAnnotateBar.opened) {
            CAJAnnotateBar.opened = true;
            annotateBarItem.classList.remove("hidden");
            viewAnnotationItem.classList.add("toggled");
        }
    },
    close : function() {
        if(!CAJAnnotateBar.opened)
            return;
        else {
            CAJAnnotateBar.opened = false;
            annotateBarItem.classList.add("hidden");
            viewAnnotationItem.classList.remove("toggled");
        }
    },
    toggle : function() {
        if(CAJAnnotateBar.opened) {
            CAJAnnotateBar.close();
        } else {
            CAJAnnotateBar.openAnnotateBar();
        }
    }
};

var TextSize = {
    firstOpen : true,
    initText : function () {
        if(TextSize.firstOpen) {
            TextSize.firstOpen = false;
            var size = document.querySelector('.annotateBar .text-size');
            [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96].forEach(function (s) {
                size.appendChild(new Option(s, s));
            });
        }
    }
}

/***************************************************************************************
* initialize colorPicker
* para:
* @1 el: currentColor element
* @2 value: color value to be set
*****************************************************************************************/ 
var COLORS = [
{ hex: '#000000', name: 'Black' },
{ hex: '#EF4437', name: 'Red' },
{ hex: '#E71F63', name: 'Pink' },
{ hex: '#8F3E97', name: 'Purple' },
{ hex: '#65499D', name: 'Deep Purple' },
{ hex: '#4554A4', name: 'Indigo' },
{ hex: '#2083C5', name: 'Blue' },
{ hex: '#35A4DC', name: 'Light Blue' },
{ hex: '#09BCD3', name: 'Cyan' },
{ hex: '#009688', name: 'Teal' },
{ hex: '#43A047', name: 'Green' },
{ hex: '#8BC34A', name: 'Light Green' },
{ hex: '#FDC010', name: 'Yellow' },
{ hex: '#F8971C', name: 'Orange' },
{ hex: '#F0592B', name: 'Deep Orange' },
{ hex: '#F06291', name: 'Light Pink' }
];

var currentPenColor = "#FF0000";    // default red
function initPenColorPicker(el, value) {
    function setColor(value) {
      currentPenColor = value;
      a.setAttribute('data-color', value);
      a.style.background = value;     
      console.log("setColor::currentPenColor=" + currentPenColor);
      closePicker();
    }

    function togglePicker() {
      if (isPenPickerOpen) {
        closePicker();
      } else {
        openPicker();
      }
    }

    function closePicker() {
      //document.removeEventListener('keyup', handleDocumentKeyup);
      // picker is colorPanel element
      if (penPicker && penPicker.parentNode) {
        penPicker.parentNode.removeChild(penPicker);
      }
      isPenPickerOpen = false;
      //a.focus();
    }

    function openPicker() {
      if (!penPicker) {
        penPicker = document.createElement('div');
        penPicker.style.background = '#fff';
        penPicker.style.border = '1px solid #ccc';
        penPicker.style.padding = '2px';
        penPicker.style.position = 'absolute';
        penPicker.style.width = '116px';
        el.style.position = 'relative';

        COLORS.map(createColorOption).forEach(function (c) {
          c.style.margin = '2px';
          c.onclick = function () {
            setColor(c.getAttribute('data-color'));
          };
          penPicker.appendChild(c);
        });
      }

      //document.addEventListener('keyup', handleDocumentKeyup);
      el.appendChild(penPicker);
      isPenPickerOpen = true;
    }

    function createColorOption(color) {
      var e = document.createElement('a');
      e.className = 'color';
      e.setAttribute('href', 'javascript://');
      e.setAttribute('title', color.name);
      e.setAttribute('data-color', color.hex);
      e.style.background = color.hex;
      return e;
    }

    var penPicker = void 0;
    var isPenPickerOpen = false;
    var currentPenValue = void 0;
    var a = createColorOption({ hex: value });
    a.onclick = togglePicker;
    el.appendChild(a);
  }


  


    var currentTextColor = "#FF0000";   // 设定当前文本颜色为#000000 
  // text color
  function initColorPicker(el, value) {
    function setColor(value) {
      currentValue = value;
      // currentTextColor 表示当前选中的文本字体的颜色
      currentTextColor = value;
        a.setAttribute('data-color', value);
        a.style.background = value;
        console.log("setColor::currentValue=" + currentValue);
        closePicker();
    }

    function togglePicker() {
      if (isPickerOpen) {
        closePicker();
      } else {
        openPicker();
      }
    }

    function closePicker() {
      //document.removeEventListener('keyup', handleDocumentKeyup);
      // picker is colorPanel element
      if (picker && picker.parentNode) {
        picker.parentNode.removeChild(picker);
      }
      isPickerOpen = false;
      //a.focus();
    }

    function openPicker() {
      if (!picker) {
        picker = document.createElement('div');
        picker.style.background = '#fff';
        picker.style.border = '1px solid #ccc';
        picker.style.padding = '2px';
        picker.style.position = 'absolute';
        picker.style.width = '116px';
        el.style.position = 'relative';

        COLORS.map(createColorOption).forEach(function (c) {
          c.style.margin = '2px';
          c.onclick = function () {
            setColor(c.getAttribute('data-color'));
          };
          picker.appendChild(c);
        });
      }

      //document.addEventListener('keyup', handleDocumentKeyup);
      el.appendChild(picker);
      isPickerOpen = true;
    }

    function createColorOption(color) {
      var e = document.createElement('a');
      e.className = 'color';
      e.setAttribute('href', 'javascript://');
      e.setAttribute('title', color.name);
      e.setAttribute('data-color', color.hex);
      e.style.background = color.hex;
      return e;
    }

    var picker = void 0;
    var isPickerOpen = false;
    var currentValue = void 0;
    var a = createColorOption({ hex: value });
    a.onclick = togglePicker;
    el.appendChild(a);
  }




var PenSize = {
    firstOpen : true,
    initPenSize :function () {
        if(PenSize.firstOpen) {
            PenSize.firstOpen = false;
            var size = document.querySelector('.annotateBar .pen-size');
            for (var i = 0; i < 20; i++) {
                size.appendChild(new Option(i + 1, i + 1));
            }
        }
    }
}

var inputEvent = {
    handleInputBlur: function () {
        console.log("handle input Blur");
        inputEvent.saveText();
    },

    closeInput : function() {
        input.removeEventListener('blur',inputEvent.handleInputBlur);
        input.removeEventListener('keyup',inputEvent.handleInputKeyup);
        document.body.removeChild(input);
        input=null;
    },

    saveText : function() {
        console.log("save text");
        if(input.value.trim().length>0) {
            // annotation Layer下面创建text
            var secLayer = createTag("section", {"class":"freeTextAnnotation", "style":"left:" + inputX + "px;top:" + inputY +"px;"}, 0);
            var svgLayer = createTag("svg", { }, 1);
            var text = createTag("text", {"fill":selectedColor, "y":input.style.fontSize, "font-size":input.style.fontSize}, 1);
            var textNode = document.createTextNode(input.value);
            text.appendChild(textNode);
            var currentPageLayer = annotateFunc.getCurrentPageView();
            var currentPageAnnotation = currentPageLayer.querySelector(".annotationLayer");
            currentPageAnnotation.appendChild(secLayer);
            secLayer.appendChild(svgLayer);
            svgLayer.appendChild(text);
        }
        inputEvent.closeInput();
    },

    handleInputKeyup: function (e) {
        console.log("handle input keyup");
        {
            if (e.keyCode === 27) {
                inputEvent.closeInput();
            } else if (e.keyCode === 13) {
                inputEvent.saveText();
            }
        }
    },

};



// 修改section=inkAnnotation的left和top，并修改svg的width和height.这需要在mousemove中记录每次移动的最大值
var penEvent = {
    svgLayerExists : false,
    left : 0,
    top : 0,
    right : 0,
    bottom : 0,
    penPoints : [],

    handleDocumentMousemove: function (e) {
        e.preventDefault(); // 阻止文本层的默认拖动高亮
        var lines = [];
        var x = e.offsetX, y = e.offsetY;  
        console.log(e.target);
        console.log("mouseMove x: " + x + "  y: " + y);   
        penEvent.penPoints.push([x, y]);    // save point

        if (!penEvent.svgLayerExists) {
            var currentPageLayer = annotateFunc.getCurrentPageView();
            var currentPageAnnotation = currentPageLayer.querySelector(".annotationLayer");

            secLayer = createTag("section", { "class": "inkAnnotation", "style":"left:0px; top:0px;"}, 0);
            svgLayer = createTag("svg", {"width":"0px", "height":"0px"}, 1);
            path = createTag("path", {
                "stroke": selectedPenColor,
                "fill": "none",
                "stroke-width": selectedPenValue
            }, 1);
            currentPageAnnotation.appendChild(secLayer);
            secLayer.appendChild(svgLayer);
            svgLayer.appendChild(path);
            penEvent.svgLayerExists = true;

            penEvent.left = x;
            penEvent.top = y;
            console.log("first position" + penEvent.left + " + " + penEvent.top);
        } 

        for (var i = 0, l = penEvent.penPoints.length; i < l; i++) {
            var p1 = penEvent.penPoints[i];
            var p2 = penEvent.penPoints[i + 1];
            if (p2) {
                lines.push('M' + (p1[0] - penEvent.left) +
                    ' ' + (p1[1] - penEvent.top) +
                    ' ' + (p2[0] - penEvent.left) +
                    ' ' + (p2[1] - penEvent.top)
                );
            }
        }
        penEvent.left = (penEvent.left > x) ? x : penEvent.left;
        penEvent.top = (penEvent.top > y) ? y : penEvent.top;
        penEvent.right = (penEvent.right < x) ? x : penEvent.right;
        penEvent.bottom = (penEvent.bottom < y) ? y : penEvent.bottom;
        console.log("move left top" + penEvent.left + " + " + penEvent.top);
        console.log("move right bottom" + penEvent.right + " + " + penEvent.bottom);
        secLayer.style.left = penEvent.left + "px";
        secLayer.style.top = penEvent.top + "px";
        svgLayer.setAttributeNS(null, "width", penEvent.right - penEvent.left + "px");
        svgLayer.setAttributeNS(null, "height", penEvent.bottom - penEvent.top + "px");
        if(lines.length != 0){
            path.setAttributeNS(null, "d", lines.join(' ') + 'Z');
        }
    },
    handleDocumentMouseup : function () {
        console.log("mouseUP " + penEvent.left + " + " + penEvent.top);

        // 清空penPoints
        penEvent.penPoints = [];
        penEvent.svgLayerExists = false;
        var currentPageLayer = annotateFunc.getCurrentPageView();
        var currentPageAnnotation = currentPageLayer.querySelector(".annotationLayer");

        //currentPageLayer.removeEventListener('mousemove', penEvent.handleDocumentMousemove);
        currentPageLayer.onmousemove = null;
        console.log(currentPageLayer.onmousemove);
        console.log("mouseUP over.\n");
    },
    handleDocumentKeyup: function (e) {// Cancel path if Esc is pressed
        if (e.keyCode === 27) {
            points = null;
            penEvent.currentPageAnnotation.removeChild(secLayer);
            currentPageAnnotation.removeEventListener('mousemove', penEvent.handleDocumentMousemove);
            currentPageAnnotation.removeEventListener('mouseup', penEvent.handleDocumentMouseup);
        }
    }
};

var svgNS = "http://www.w3.org/2000/svg";
function createTag(tag, objAttr, tagType)
{
    var oTag;
    if(tagType==0) {
        oTag = document.createElement(tag);
    } else if(tagType == 1) {
        oTag = document.createElementNS(svgNS, tag);
    }

    for(var attr in objAttr) {
        oTag.setAttribute(attr, objAttr[attr]);
    }
    return oTag;
}

var g_allAnnotation = [];   
// 点开标注功能,现在是11个功能  默认无注释工具被选中
var g_lastActivedAnnotation = null;

var annotateFunc = {
    getCurrentPageView : function()
    {
        var currentPageLayer = document.querySelector('.page[data-page-number="' + g_currentPageNumber + '"]');
        return currentPageLayer;
    },
    dealwithCursor : function()
    {
        //var currentPageAnnotation = annotateFunc.getCurrentPageView();

    },

    dealwithRectangle : function()
    {
            // 选择到了annotationLayer这一层
            var currentPageLayer = annotateFunc.getCurrentPageView();
            var currentTextLayer = currentPageLayer.querySelector(".textLayer");

            var currentPageAnnotation = currentPageLayer.querySelector(".annotationLayer");
            console.log("currentPage: " + g_currentPageNumber);
            currentPageLayer.onmousedown = function(ev) { 
                ev.preventDefault();    // 阻止文本层的默认行为
                // ev.target.onmousedown = null;
                // ev.target.onmousemove = null;
                //ev.preventDefault();    // 选择的实际上是文本层
                console.log(ev.target);
                console.log(ev.currentTarget);
                isMoved = false;
                var baseX = 0, baseY = 0;
                if(ev.target.nodeName == "SPAN") {
                    
                    baseX = parseInt(ev.target.style.left, 10);                
                    baseY = parseInt(ev.target.style.top, 10);
                }
                x1 = ev.offsetX + baseX;
                y1 = ev.offsetY + baseY;
                // x1 = ev.offsetX;
                // y1 = ev.offsetY;
                let x2, y2, width, height;
                console.log("ev.offsetX:" + ev.offsetX);
                console.log("ev.offsetY:" + ev.offsetY);
                console.log("Down:x1,y1   " + x1 + ', ' + y1);
                let secLayer = document.createElement("section");
                secLayer.setAttribute("class", "rectangleAnnotation");
                secLayer.setAttribute("style", "left:" + x1 + "px; " +  "top:" + y1 + "px; ");
                let divLayer = document.createElement("div");
                divLayer.style.position = 'absolute';
                divLayer.style.border = "2px solid red";
                currentPageAnnotation.appendChild(secLayer);
                secLayer.appendChild(divLayer);
                currentPageLayer.onmousemove = function(ev) {
                    ev.preventDefault();
                    var baseX = 0, baseY = 0;
                    if(ev.target.nodeName == "SPAN") {
                        baseX = parseInt(ev.target.style.left, 10);                
                        baseY = parseInt(ev.target.style.top, 10);
                    }
                    x2 = ev.offsetX + baseX;
                    y2 = ev.offsetY + baseY;
                    width = x2 - x1;
                    height = y2 - y1;  
                    if(width !=0 && height != 0)
                        isMoved = true;
                   // console.log("Move:x2,y2   " + x2 + ', ' + y2);
                    //console.log("Move:width,height   " + width + ', ' + height);
                    //console.log(ev.target);
                    //console.log(ev.currentTarget);
                    divLayer.style.width = width + "px";
                    divLayer.style.height = height + "px";
                    currentPageLayer.onmouseup = function (ev) {
                        currentPageLayer.onmousemove = null;
                        if(!isMoved) {
                            // remove dynamic elements
                            secLayer.removeChild(divLayer);
                            currentPageAnnotation.removeChild(secLayer);
                        }
                        //console.log("Up:x1,y1   " + x1 + ', ' + y1);
                        //console.log("Up:x2,y2   " + x2 + ', ' + y2);
                    }
                }
            }
    },

/*
    dealwithHighlight : function() {
        // highlight方法：section下面创建svg.  svg下面创建g，g下面层创建rect。
        var currentPageLayer = annotateFunc.getCurrentPageView();
        var currentTextLayer = currentPageLayer.querySelector(".textLayer");
        var currentPageAnnotation = currentPageLayer.querySelector(".annotationLayer");

        currentPageLayer.onmousedown = function (ev) {
            console.log("Down ev.target  " + ev.target);    // 选择的是textLayer的span标签
            console.log("Down ev.currentTarget   " + ev.currentTarget);
            var objHighlight = ev.target;
            var left = objHighlight.style.left;
            var top = objHighlight.style.top;
            var font = objHighlight.style.fontSize;
            console.log("left: " + left + "top: " + top + "font: " + font);
            currentPageLayer.onmouseup = function (ev) {
                var width = ev.offsetX;
                var y2 = ev.offsetY;
                var height = font;

                console.log(width + " width    " + y2 + " y2   " + height + "height   ");
                if (width == 0) {
                    return;
                }
                let secLayer = document.createElement("section");
                secLayer.setAttribute("class", "highlightAnnotation");
                secLayer.setAttribute("style", "left:" + left + "; top:" + top);
                currentPageAnnotation.appendChild(secLayer);

                var svgLayer = createSvgTag("svg", { });
                secLayer.appendChild(svgLayer);
                var gLayer = createSvgTag("g", {"fill":"#FFFF00", "fill-opacity":"0.2"});
                svgLayer.appendChild(gLayer);
                var rectLayer = createSvgTag("rect", {"width":width + "px", "height":height})
                gLayer.appendChild(rectLayer);
            }
        }
    },
    */

   dealwithHighlight : function() {
    // highlight方法：section下面创建svg.  svg下面创建g，g下面层创建rect。
    var currentPageLayer = annotateFunc.getCurrentPageView();
    var currentTextLayer = currentPageLayer.querySelector(".textLayer");
    var currentPageAnnotation = currentPageLayer.querySelector(".annotationLayer");

    currentPageLayer.onmousedown = function (ev) {
        console.log("Down ev.target  " + ev.target);    // 选择的是textLayer的span标签
        console.log("Down ev.currentTarget   " + ev.currentTarget);

        var currentElement = ev.target;
        var left = currentElement.style.left;
        var top = currentElement.style.top;
        var font = currentElement.style.fontSize;
        var totalFont = parseInt(font, 10);
        console.log("left: " + left + "top: " + top + "font: " + font + "totalFont" + totalFont);
        currentPageLayer.onmouseup = function (ev) {
            console.log("Up ev.target  " + ev.target);    // 选择的是textLayer的span标签
            console.log("Up ev.currentTarget   " + ev.currentTarget);
            var selectionHeight = ev.offsetY;
            console.log(selectionHeight);
            // for multiline highlight
            let secLayer = createTag("section", {
                "class": "highlightAnnotation", "style": "left:" + left + "; top:" + top,
                "width": "100px", "height": selectionHeight
            }, 0);
            currentPageAnnotation.appendChild(secLayer);
            var svgLayer = createTag("svg", { }, 1);
            secLayer.appendChild(svgLayer);
            var gLayer = createTag("g", {"fill":"#FFFF00", "fill-opacity":"0.2"}, 1);
            svgLayer.appendChild(gLayer);
            while (selectionHeight > totalFont) {
                var rectLayer = createTag("rect", {
                    "x": currentElement.style.left,
                    "y": currentElement.style.top,
                    "width": width + "px", "height": height
                }, 1)
                gLayer.appendChild(rectLayer);
                currentElement = currentElement.nextSibling;
                totalFont += parseInt(currentElement.style.fontSize, 10);
            }
        }
    }
},
    dealwithStrikeout : function()
    {

    },
    
    dealwithText : function()
    {   
        var selectedItem = document.querySelector(".text-size");
        var currentPageLayer = annotateFunc.getCurrentPageView();

        currentPageLayer.onclick = function (ev) {
            //readFontSize
             selectedIndex = selectedItem.selectedIndex;
             selectedValue= selectedItem.options[selectedIndex].text;
            //readFontColor
             selectedColor = currentTextColor;

             // 可能选择到文本层，也可能选择到了图像层，所以区分ev的类型
             console.log(ev.target);
             console.log(ev.currentTarget);
             var baseX = 0, baseY = 0;
            if(ev.target.nodeName == "SPAN") {
                baseX = parseInt(ev.target.style.left, 10);                
                baseY = parseInt(ev.target.style.top, 10);
            }
            inputX = ev.offsetX + baseX;
            inputY = ev.offsetY + baseY;
            console.log("selectedValue: " + selectedValue + "\nselectedColor: " + selectedColor);
            console.log("x: " + inputX + "\ny: " + inputY);
            input=document.createElement('input');
            input.setAttribute('id','pdf-annotate-text-input');
            input.setAttribute('placeholder','Enter text');
            input.style.border='3px solid '+ selectedColor;
            input.style.position='absolute';
            input.style.top=ev.clientY+'px';
            input.style.left=ev.clientX+'px';
            input.style.fontSize = selectedValue + 'px';
            // onblur 属性在元素失去焦点时触发
            input.addEventListener('blur',inputEvent.handleInputBlur);
            input.addEventListener('keyup',inputEvent.handleInputKeyup);
            document.body.appendChild(input);
            input.focus();
        }
    },
    dealwithPen: function () {
        var selectedItem = document.querySelector(".pen-size");
        var currentPageLayer = annotateFunc.getCurrentPageView();

        currentPageLayer.onmousedown = function() {
        //readFontSize
        selectedIndex = selectedItem.selectedIndex;
        selectedPenValue = selectedItem.options[selectedIndex].text;
        //readFontColor
        selectedPenColor = currentPenColor;

        console.log("selectedValue=" + selectedPenValue);
        console.log("selectedColor=" + selectedPenColor);

        currentPageLayer.onmousemove = penEvent.handleDocumentMousemove;
        currentPageLayer.onmouseup = penEvent.handleDocumentMouseup;
        }
    }
};


function dealwithAnnotation()
{
    // add all the annotation button click event
    switch(g_lastActivedAnnotation.getAttribute("class").split(" ")[0])
    {
        case "cursor": 
            console.log("cursor dealwith");
            annotateFunc.dealwithCursor(); 
            break;
        case "rectangle":
            console.log("rectangle dealwith"); 
            annotateFunc.dealwithRectangle();
            break;
        case "highlight":
            console.log("highlight dealwith");
            annotateFunc.dealwithHighlight();
            break;
        case "strikeout":
            console.log("strikeout dealwith");
            //annotateFunc.dealwithStrikeout();
            break;
        case "text":
            console.log("text dealwith");
            annotateFunc.dealwithText();
            break;
        case "pen":
            console.log("pen dealwith");
            annotateFunc.dealwithPen();
            break;
        default:
            console.log("default dealwith");
            break;
    }
}

function annotateClickEvent()
{
    var items = document.getElementById("annotateBar").childNodes;
    //console.log(items.length);
    for(var i = 0; i < items.length; i++) {
        //console.log(i + ": " + items[i].nodeName);
        if(items[i].nodeType != items[0].nodeType &&
        items[i].nodeName == "BUTTON")  {
            console.log(i + ": " + items[i].nodeName);
            console.log(items[i].getAttribute("class"));
            g_allAnnotation.push(items[i]);
        }
    };
    
    for(var i = 0; i < g_allAnnotation.length; i++) {
        g_allAnnotation[i].addEventListener('click', function() {
            if(g_lastActivedAnnotation) {
                if(g_lastActivedAnnotation == this) {
                    return;
                }
                g_lastActivedAnnotation.classList.remove("active");

                var currentPageLayer = annotateFunc.getCurrentPageView();
                currentPageLayer.onmousedown = null;
                currentPageLayer.onmousemove = null;
                currentPageLayer.onmouseup = null;
                currentPageLayer.onclick = null;
            }
            this.classList.add("active");   // 要用this代表单击事件的拥有者
            g_lastActivedAnnotation = this;
            dealwithAnnotation();
        })
    }
}


function AnnotateBar()
{
    console.log("Enter AnnotateBar");
    annotateBarItem = document.getElementById("annotateBar");
    viewAnnotationItem = document.getElementById("viewAnnotation");

    // toggle annotationBar
    viewAnnotationItem.addEventListener('click',CAJAnnotateBar.toggle);

    // load textSize first time
    TextSize.initText();
    // toggle text color-panel
    textColorItem = document.querySelector(".annotateBar .text-color");
    initColorPicker(textColorItem, "#FF0000");

    // load penSize first time
    PenSize.initPenSize();
    // toggle pen color-panel
    penColorItem = document.querySelector(".annotateBar .pen-color");
    initPenColorPicker(penColorItem, "#FF0000");

    annotateClickEvent();
}


function initFunctionality()
{
    findInFile();
    AnnotateBar();
}


function initAll() {
    hideNotUsedButton();

    initFunctionality();
    var ret = zDocumentObj.loadDLL();
    console.log("loadDLL ret:", ret);
    if (ret != 0) {
        process.exit(ret);
    }
    console.log("initAll done.");
}

function setPageNumber(){
    document.getElementById("pageNumber").value = g_currentPageNumber;
}

function calulatePageNumber() {
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
    zDocumentObj.getText(pageNumber);
    let lineCount = zDocumentObj.getLineCount(pageNumber);
    console.log("lineCount:", lineCount);
    let textLayer = document.createElement("div");
    textLayer.className = "textLayer";
    textLayer.style.width = pageImg.width + "px";
    textLayer.style.zIndex = 9999;
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

function drawLinkAnnotation(str, currentPageNum)
{
    parser=new DOMParser();
    const content = fs.readFileSync(str);
    xmlDoc=parser.parseFromString(content,"text/xml");

    var x = xmlDoc.getElementsByTagName("NoteItems")[0].childNodes;
    var numNodes = x.length; 
    // 解析每一个Item结点，从子结点<RC>中获取超链接区域，解析，
    var preAnnotationPage = 0;
    for(var i = 1; i < numNodes; i+=2) 
    {
        // 删除文本结点
        // if(x[i].nodeType)
        //  x[i].parentNode.removeChild(x[i]);
        var page = x[i].getAttribute('Page');
        var DescText = x[i].getAttribute('DescText');
        var left = multiBy(x[i].childNodes[1].getAttribute('l'));
        var top = multiBy(x[i].childNodes[1].getAttribute('t'));
        var right = multiBy(x[i].childNodes[1].getAttribute('r'));
        var bottom = multiBy(x[i].childNodes[1].getAttribute('b'));
        var Aim = x[i].childNodes[3].getAttribute('Aim');
        var titleIsShow = x[i].childNodes[3].getAttribute("Title");

        let source = Buffer.from(DescText, 'base64');
        let dest = source.toString(('utf16le'));        // Base64转换为utf16le

        let viewer = document.getElementById("viewer");
        // 创建div ,div append section，section append a标签,并设置section属性 包括区域等
        /*
        if(preAnnotationPage != page)
        {
            var annotationLayer = document.createElement("div");
            annotationLayer.setAttribute("class", "annotationLayer");
            viewer.childNodes[page - 1].appendChild(annotationLayer);
            preAnnotationPage = page;
        }
        */
        var currentPageLayer = document.querySelector('.page[data-page-number="' + currentPageNum + '"]');
        var annotationLayer = currentPageLayer.querySelector(".annotationLayer");
        let annotation = document.createElement("section");
        annotation.setAttribute("class", "linkAnnotation");
        let width = right - left;
        let height = bottom - top;

        //annotation.style.borderColor = "black";
        //annotation.style.borderStyle = "solid";
        annotation.style.width = width + "px";
        annotation.style.height =  height + "px";
        annotation.style.left = left + "px";
        annotation.style.top = top + "px";
        annotation.onmouseover = function() {
            annotation.style.border = "1px solid black"
        };
        annotation.onmouseout = function() {
            annotation.style.border = "";
        };

        annotationLayer.appendChild(annotation);

        let link = document.createElement("a");
        //if(titleIsShow != False)
            link.setAttribute("title", dest);
        link.setAttribute("href", Aim);
        link.setAttribute("target", " ");
        annotation.appendChild(link);
    }
    console.log(numNodes);
    console.log("parseXML done.");
}

function drawAnnotation(currentPage, currentPageNum)
{
    var annotationLayer = document.createElement("div");
    annotationLayer.setAttribute("class", "annotationLayer");
    annotationLayer.setAttribute("style", "z-index:-8888;");
    currentPage.append(annotationLayer);
    if(currentPageNum == 2)
        drawLinkAnnotation("C:\\Users\\LC\\Desktop\\notes.xml", currentPageNum);
}

function imageOnLoad() {
    let pageCanvasWrapper = document.createElement("div");
    pageCanvasWrapper.className = "canvasWrapper";
    pageCanvasWrapper.style.width = this.width + "px";
    pageCanvasWrapper.style.height = this.height + "px";
    pageCanvasWrapper.style.zIndex = "-9999";
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
    console.log("ctx:", ctx);
    ctx.save();
    // this.style.transform = 'rotate('+current+'deg)'
    // var canvasWidth = pageCanvas.width;
    // console.log("canvasWidth:", canvasWidth);
    var width = this.width;
    console.log("pageWidth:", width);
    var x = 0;
    var y = 0;
    var height = this.height;
    console.log("pageHeight:", height);
    ctx.scale(1, -1);
    // ctx.scale(0.12, -0.12);
    ctx.drawImage(this, x, -height - y, width, height);
    drawTextLayer(this.zDocumentObj, this.pageNumber, this.page, this, ctx);
    ctx.restore();

    drawAnnotation(this.page, this.pageNumber);
}

let g_pageImg = [];

function drawPage2(fileName) {
    g_zpages = [];
    zDocumentObj.init();
    zDocumentObj.openFile(fileName);
    let pageCount = zDocumentObj.getPageCount();
    console.log("pageCount out:", pageCount);
    let pageNumber = 1;// 页码
    let nScale = 100; // 缩放
    let millisencods = 1000;// 等待时间
    zDocumentObj.getImage(pageNumber, nScale, millisencods);
    zDocumentObj.getImage(pageNumber + 1, nScale, millisencods);
    zDocumentObj.getImage(pageNumber + 2, nScale, millisencods);

var firstLoadPageNumber = pageNumber +2;
 /*
zDocumentObj.getImage(pageNumber+3, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 4, nScale, millisencods);
zDocumentObj.getImage(pageNumber+5, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 6, nScale, millisencods);
zDocumentObj.getImage(pageNumber+7, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 8, nScale, millisencods);
zDocumentObj.getImage(pageNumber+9, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 10, nScale, millisencods);
zDocumentObj.getImage(pageNumber+11, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 12, nScale, millisencods);
zDocumentObj.getImage(pageNumber+13, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 14, nScale, millisencods);
zDocumentObj.getImage(pageNumber+15, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 16, nScale, millisencods);
zDocumentObj.getImage(pageNumber+17, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 18, nScale, millisencods);
zDocumentObj.getImage(pageNumber+19, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 20, nScale, millisencods);
zDocumentObj.getImage(pageNumber+21, nScale, millisencods);
 zDocumentObj.getImage(pageNumber +22, nScale, millisencods);
zDocumentObj.getImage(pageNumber+23, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 24, nScale, millisencods);
zDocumentObj.getImage(pageNumber+25, nScale, millisencods);
 zDocumentObj.getImage(pageNumber + 26, nScale, millisencods);

*/
    let viewer = document.getElementById("viewer");
    viewer.innerHTML = "";
    let spanpageNumbers = document.getElementById("numPages");
    spanpageNumbers.textContent =  "/ " +  pageCount.toString();
    let pageNumberInput = document.getElementById("pageNumber");
    pageNumberInput.setAttribute("max", pageCount);
    // pageCount = 1;
    for (var i = 1; i <= firstLoadPageNumber; i++) {
        //zDocumentObj.getText(i);
        var arrayBuffer = zDocumentObj.getPageData(i);
        let nativeImage1 = nativeImage.createFromBuffer(arrayBuffer);
        let page = document.createElement("div");
        viewer.appendChild(page);
        page.setAttribute("data-loaded", true);
        page.className = "page";
        page.setAttribute("data-page-number", i);

        let pageImg = new Image();
        g_pageImg.push(pageImg);
        pageImg.src = nativeImage1.toDataURL();
        pageImg.page = page;
        pageImg.pageNumber = i;
        pageImg.onload = imageOnLoad;
        pageImg.zDocumentObj = zDocumentObj;
    }
    setPageButton();
    setScrollEvent();
}

function findInFile()
{
    var find = document.getElementById("viewFind");
    var hidden = document.getElementById("findbar");
    find.addEventListener("click", function() {
        if(find.getAttribute("class") == "toolbarButton") {
             find.setAttribute("class", "toolbarButton toggled");
             hidden.setAttribute("hidden", "false");
        }
        else {
            find.setAttribute("class", "toolbarButton");
            hidden.setAttribute("hidden", true);
        }
    });
}



const printFileButton = document.getElementById("print");
printFileButton.addEventListener('click', function () {
    console.log("print is executing");
/*
    var myPrint = document.getElementById("printContainer");
    let pagesCount = g_zpages.length
    for(var i = 0; i < pagesCount; i++) {
        var divPage = document.createElement("div");
        var imagePage = document.createElement("img");
        imagePage.src = g_pageImg[i].src;
        imagePage.style.width = g_pageImg[i].width + "px";
        imagePage.style.height = g_pageImg[i].height + "px";
        myPrint.appendChild(divPage);
        divPage.appendChild(imagePage);
    }
  */
    window.print();
});


window.addEventListener(
    "keydown",
    function (event) {
      // Intercept Cmd/Ctrl + P in all browsers.
      // Also intercept Cmd/Ctrl + Shift + P in Chrome and Opera
      if (
        event.keyCode === /* P= */ 80 &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        (!event.shiftKey || window.chrome || window.opera)
      ) {
        window.print();
  
        // The (browser) print dialog cannot be prevented from being shown in
        // IE11.
        event.preventDefault();
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        } else {
          event.stopPropagation();
        }
      }
    },
    true
  );