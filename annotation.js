"use strict";



function decodeDescText(descTextBase64){
    let text1 = atob(descTextBase64);
    let cp = [];
    for(let i = 0; i < text1.length; i += 2){
        cp.push(
            text1.charCodeAt(i) |
            (text1.charCodeAt(i + 1) << 8)
        );
    }
    return String.fromCharCode.apply(String, cp);
}

function drawLinkAnnotation(requestURL, currentPageNum)
{
    // let requestURL = 'data/page.json';
    console.log("requestUrl:", requestURL);
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'text';
    request.send();
    request.onload = function () {
        parser=new DOMParser();
        // const content = fs.readFileSync(str);
        // console.log("data:", data);
        xmlDoc=parser.parseFromString(request.response,"text/xml");
    
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
    
            // let source = Buffer.from(DescText, 'base64');
            // let dest = source.toString(('utf16le'));        // Base64转换为utf16le
            // console.log("DescText:", DescText);
            // let source = window.atob(DescText);
            // console.log("source:", source);
            let dest = decodeDescText(DescText);
           
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
    };
    console.log("parseXML done.");
}

function drawAnnotation(currentPage, currentPageNum, pageAnnotationUrl)
{
    var annotationLayer = document.createElement("div");
    annotationLayer.setAttribute("class", "annotationLayer");
    annotationLayer.setAttribute("style", "z-index:-8888;");
    currentPage.append(annotationLayer);
    drawLinkAnnotation(pageAnnotationUrl, currentPageNum);
}

export {drawAnnotation };