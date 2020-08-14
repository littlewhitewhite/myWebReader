"use strict";

function multiBy(value) {
    var ratio = 1.333;
    var scale = 1;
    // var scale2 = window.devicePixelRatio;
    var scale2 = 1;
    // console.log("window.devicePixelRatio:", scale2);
    return value * ratio * scale * scale2 / 100.0;
}


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













/*********************************************************************************************** 
 * PDFFind: public method: @1:
 * 
************************************************************************************************/

/********************************************************************************************
 * 1：toggle event of findButton
 * 2: input event of findFiled：start to find->CaseSensitive->phrase Find / Word Find->(highlight-->
	dynamic highlight words(includeing the increment or decrement of input words)->
	updateResultsCount(including current and total)->previous and next match(different 
	highlight color of selected and nonselected, and jump to corresponding position)
	the important is to optimize search exection.
 ********************************************************************************************/

const MATCHES_COUNT_LIMIT = 1000;

class PDFFind {
    constructor(options, matchDisplay) {
        this.opened = false;

        // attribute of findBar
        this.bar = options.bar || null;
        this.toggleButton = options.toggleButton || null;
        this.findField = options.findField || null;
        this.highlightAll = options.highlightAllCheckbox || null;
        this.caseSensitive = options.caseSensitiveCheckbox || null;
        this.entireWord = options.entireWordCheckbox || null;
        this.findMsg = options.findMsg || null;
        this.findResultsCount = options.findResultsCount || null;
        this.findPreviousButton = options.findPreviousButton || null;
        this.findNextButton = options.findNextButton || null;

		this.viewer = options.viewer;
		this.mainContainer = options.mainContainer;
        // attributes of FindContents
        this.totalMatches = 0;	// total matches count
        this.currentMatches = [];	// matches count of per page
        // all the matches query , {"begin" : {"divIdx": num, "offset": offsetNum}, "end" : {"divIdx": num, "offset": offsetNum},spanIdx:spanIdx}
        this.matches = [];

        this.textDivs = [];	// all the span element in textLayer of currentPage
        this.highLighted = false;	// bool , isHighlighted
        this.currentSelectedPos = 1;	// index of currentMatch in this.matches[]
        this.matchDisplay = matchDisplay;	// top value to read conveniently
	
		this.findField.setAttribute("autocomplete", "off");
		
        // Add event listeners to the DOM elements.
        this.toggleButton.addEventListener("click", () => {
			// get pageCount
			this.pageCount = this.viewer.querySelectorAll(".page").length;
            this.toggle();
        });

        this.findField.addEventListener("input", () => {
            this.findInFile();
        });

        this.bar.addEventListener("keydown", e => {
            switch (e.keyCode) {
                case 13: // Enter
				console.log(e.target.id + 13);
                    if (e.target === this.findField) {
                        this.getSelected(!e.shiftKey);
                    }
                    break;
                case 27: // Escape
				console.log(e.target.id + 27);
                    this.close();
                    break;
            }
        });

		// mainContainer add keydown event of escape key
		this.mainContainer.addEventListener("keydown", e => {
			if(e.keyCode == 27) {
				this.close();
			}
		});	
		
        this.findPreviousButton.addEventListener("click", () => {
            console.log("find previous");
            this.getSelected(false);
        });

        this.findNextButton.addEventListener("click", () => {
            console.log("find next");
            this.getSelected(true);
        });
		// if highlightAll is enabled in html, then attach event.
		if(this.highlightAll) {
			this.highlightAll.addEventListener("click", () => {
				console.log("highlightAll is " + this.highlightAll.checked);
				this.updateHighlightMatches(this.findField.value, this.highlightAll.checked);
			});
		}
        this.caseSensitive.addEventListener("click", () => {
            console.log("caseSensitive");
            this.findInFile();
        });

		// if entireWord is enabled in html, then attach event.
		if(this.entireWord) {
			this.entireWord.addEventListener("click", () => {
				console.log("entire word");
				this.findInFile();
			});
		}

    }

    open() 
	{
        if (!this.opened) {
            this.opened = true;
            this.toggleButton.classList.add("toggled");
            this.bar.classList.remove("hidden");
        }
        this.findField.select();
        this.findField.focus();
        this.adjustWidth();
    }

    close() 
	{
        if (!this.opened) {
            return;
        }
        this.opened = false;
        this.toggleButton.classList.remove("toggled");
        this.bar.classList.add("hidden");
    }

    toggle() 
	{
        if (this.opened) {
            this.close();
        } else {
            this.open();
        }
    }


    getCharacterType(character) 
	{
        return false;
    }
	
    /**************************************************************************************************** 
     * Private
     * isEntireWord : check entireWord or partialWord match.
     *                once the this.entireWord is true, call this func in calculatePhraseMatch.
     * @content:      pageTextContents;
     * @startIdx:     the index of the substring to query in @content ;
     * @length:       length of substring to query;
     * returnVal:     return false if it's just partial match.
     ****************************************************************************************************/
    isEntireWord(content, startIdx, length) 
	{
        if (startIdx > 0) {
            const first = content.charCodeAt(startIdx);
            const limit = content.charCodeAt(startIdx - 1);
            if (this.getCharacterType(first) === this.getCharacterType(limit)) {
                return false;
            }
        }
    }

    // Private function 
    appendTextToDiv(divIdx, currentMatchContent, fromOffset, toOffset, className) 
	{
        const div = this.textDivs[divIdx];
        const content = currentMatchContent.substring(
            fromOffset,
            toOffset
        );
        const node = document.createTextNode(content);
        if (className) {
            const span = document.createElement("span");
            span.className = className;
            span.appendChild(node);
            div.appendChild(span);
            return;
        }
        div.appendChild(node);
    }

    /*************************************************************************************************************** 
	 * update highlight word：1: clear all the the former highlight (splited)word in this.matches[].
	 *						  2: find all the matches query from all pages, all span elements in textLayer.
	 *							 then store into this.matches[] and this.currentMatches  
	 *						  3: highlight(split) all the matches query
	 *						  4: count totalMatches according to this.matches[]
	 * parameter: 
	 *			@1 query: the word to find
	 *			@2 whether or not highlight word
	****************************************************************************************************************/
    updateHighlightMatches(query, isHighlightMatches)
	{
        const queryLen = query.length;

        if (queryLen == 0 && this.totalMatches == 0) {
            return;
        }

        this.currentMatches[0] = 0;
        this.totalMatches = 0;

        // this.matches and this.currentMatches should be cleared at the time after clear the highlight  应该在清除当前高亮之后再置空。
        if (this.highLighted) {
            for (let currentPage = 1; currentPage <= this.pageCount; currentPage++) {
                this.textDivs = document.querySelector('.page[data-page-number="' + currentPage + '"] .textLayer').childNodes;
                let clearedUntilDivIdx = -1;	// in order to avoid seting text repeatly
				
                for (let i = this.currentMatches[currentPage - 1], ii = this.currentMatches[currentPage]; i < ii; i++) {
                    const match = this.matches[i];
                    const begin = Math.max(clearedUntilDivIdx, match.begin.divIdx);
                    for (let n = begin, end = match.end.divIdx; n <= end; n++) {
                        const div = this.textDivs[n];
                        div.textContent = this.textDivs[n].textContent;
                        div.className = "";
                    }
                    clearedUntilDivIdx = match.end.divIdx + 1;
                }
            }
        }

        this.matches = [];	// clear matches in order to do next query
        this.currentMatches = [0];
        if (queryLen == 0) {
            this.totalMatches = 0;	
            return;
        }
        for (let currentPage = 1; currentPage <= this.pageCount; currentPage++) {            
            this.textDivs = document.querySelector('.page[data-page-number="' + currentPage + '"] .textLayer').childNodes;

            // get matches
            for (let i = 0; i < this.textDivs.length; i++) {
                let spanIdx = 0;
                let tmp = -queryLen;
                let currentDivContent = this.textDivs[i].textContent;
                if (!this.caseSensitive.checked) {
                    currentDivContent = currentDivContent.toLowerCase();
                }
                // each span element may have more than one match query, so we use while loop to iterate this span
                while ((tmp = currentDivContent.indexOf(query, tmp + queryLen)) != -1) {
                    this.matches.push({
                        begin: { divIdx: i, offset: tmp },
                        end: { divIdx: i, offset: tmp + queryLen },
                        spanIdx: spanIdx++
                    });
                }
            }

            this.currentMatches[currentPage] = this.matches.length;	 

            // if parameter isHighlightMatches is true this highlight all match contents 
            // then splitHighlightWord
            if (isHighlightMatches == true) {
                this.highLighted = true;
				let currentMatchContent = "";
				let formerIdx = 0;
				
                for (let i = this.currentMatches[currentPage - 1], ii = this.matches.length; i < ii; i++) {
                    const match = this.matches[i];
                    const begin = match.begin.divIdx;
                    const end = match.end.divIdx;
                    let fromOffset = match.begin.offset;
                    let toOffset = match.end.offset;
					
					// clear and split current match content when the key of this.matches.spanIdx turns to 0.
					if(this.matches[i].spanIdx == 0) {
						currentMatchContent = this.textDivs[begin].textContent;
						this.textDivs[begin].textContent = "";
						formerIdx = 0;
					}
					
					this.appendTextToDiv(begin, currentMatchContent, formerIdx, fromOffset);	// create the formor text
                    this.appendTextToDiv(begin, currentMatchContent, fromOffset, toOffset, "highlight");	// create the middle highlight text
                    formerIdx = toOffset;
					// the key of the next match element of this.matches.spanIdx turns to 0 which means the next element is in another new span element.
					// then we should create the latter text element.
					if(i + 1 < ii && this.matches[i + 1].spanIdx != 0) {
						continue;
					}
					this.appendTextToDiv(begin, currentMatchContent, toOffset);
					
		/*			
					if(i < ii && this.matches[i + 1].spanIdx == 0) {
						this.appendTextToDiv(begin, currentMatchContent, toOffset);	// create the latter text, only create once for a span element
					}
					if(i == ii) {
						this.appendTextToDiv(begin, currentMatchContent, toOffset);	// create the latter text, only create once for a span element
					}
					*/
                }
            }
        }
        this.totalMatches = this.matches.length;
    }

    // in order to read conveniently , we keep the match query at MATCHDISPLAY height
    updatePage(selectedPos) 
	{
        let pageInfo = this.getPageInfoBySelectedPos(selectedPos);

        let scrollTop = 0;
        let spanTop = pageInfo.spanObj.style.top;

        for (let i = 0; i < pageInfo.page - 1; i++) {
            scrollTop += g_zpages[i].height;
        }
        let viewerContainerElement = document.getElementById("viewerContainer");
        viewerContainerElement.scrollTop = scrollTop + (parseInt(spanTop) - this.matchDisplay);
    }

    // update matchResult bar
    updateResultsCounts(current = 0, total = 0)
	{
        console.log("UIResultsCount start to updated.");
        if (!this.findResultsCount) {
            return; // No UI control is provided.
        }
        console.log("UIResultsCount start to updated2.");
        const limit = MATCHES_COUNT_LIMIT;
        let matchesCountMsg = "";

        if (total == 0) {
            // 找不到指定词语
            matchesCountMsg = "找不到指定词语";
        } else if (total > 0 && total < MATCHES_COUNT_LIMIT) {
            // 查询到1-1000条记录, 第 项，查询到 项
            matchesCountMsg = "第" + current + " 项， " + "查询到 " + total + " 项";
        } else {
            // 超过1000项匹配
            matchesCountMsg = "超过1000项匹配";
        }
        console.log("matchesCountMsg", matchesCountMsg);
        findResultsCount.textContent = matchesCountMsg;
        this.findResultsCount.classList.toggle("hidden", !total);
        this.adjustWidth();
    }

    // adjust the width and height whenever findBar is changed
    adjustWidth() 
	{
        if (!this.opened) {
            return;
        }

        // The find bar has an absolute position and thus the browser extends
        // its width to the maximum possible width once the find bar does not fit
        // entirely within the window anymore (and its elements are automatically
        // wrapped). Here we detect and fix that.
        this.bar.classList.remove("wrapContainers");

        const findbarHeight = this.bar.clientHeight;
        const inputContainerHeight = this.bar.firstElementChild.clientHeight;

        if (findbarHeight > inputContainerHeight) {
            // The findbar is taller than the input container, which means that
            // the browser wrapped some of the elements. For a consistent look,
            // wrap all of them to adjust the width of the find bar.
            this.bar.classList.add("wrapContainers");
        }
    }

    calculatePhraseMatch(query, pageIndex, pageContent, entireWord)
	{
        const matches = [];
        const queryLen = query.length;

        let matchIdx = -queryLen;
        while (true) {
            matchIdx = pageContent.indexOf(query, matchIdx + queryLen);
            if (matchIdx === -1) {
                break;
            }
            if (entireWord && !this.isEntireWord(pageContent, matchIdx, queryLen)) {
                continue;
            }
            matches.push(matchIdx);
        }
        this.pageMatches[pageIndex] = matches;
    }

	// remain to implement.
	// query world or query phrase
    calculateWordMatch(query, pageIndex, pageContent, entireWord) 
	{

    }

    /* an alternative method to find matches */
    calculateMatch(pageIndex, findCondition) {
        let pageContent = this.pageContents[pageIndex];
        let query = findCondition.query;
        let caseSensitive = findCondition.caseSensitive;
        let entireWord = findCondition.entireWord;
        let phraseSearch = findCondition.phraseSearch;
        let highlightAll = findCondition.highlightAll;

        if (query.length === 0) {
            // Do nothing: the matches should be wiped out already.
            return;
        }

        if (!caseSensitive) {
            pageContent = pageContent.toLowerCase();
            query = query.toLowerCase();
        }

        if (phraseSearch) {
            this.calculatePhraseMatch(query, pageIndex, pageContent, entireWord);
        } else {
            this.calculateWordMatch(query, pageIndex, pageContent, entireWord);
        }

        const pageMatchesCount = this.pageMatches[pageIndex].length;
        if (pageMatchesCount == 0) {
            this.currentMatches[pageIndex] = this.totalMatches;
        } else if (pageMatchesCount > 0) {
            this.currentMatches[pageIndex] = this.totalMatches + 1;
            this.totalMatches += pageMatchesCount;
        }
    }


	// main method to execute find operation
    findInFile() 
	{
        this.findCondition = {
            query: this.findField.value,
            phraseSearch: true,
            caseSensitive: this.caseSensitive.checked,
            //entireWord: this.entireWord.checked,
			entireWord: true,
            //highlightAll: this.highlightAll.checked,	// too complicated , remain to implement
            highlightAll: true,
        };

        this.pageMatches = [];
        this.updateHighlightMatches(this.findCondition.query, this.findCondition.highlightAll);

        this.currentSelectedPos = (this.totalMatches > 0) ? this.currentMatches[g_currentPageNumber - 1] + 1 : 0;	// 还需要setpage为匹配到的那一页        
        this.updateResultsCounts(this.currentSelectedPos, this.totalMatches);
        // if match word exists then set first match word highlight
		if (this.totalMatches > 0) {
            this.handleSelected(this.currentSelectedPos, "add");
            this.updatePage(this.currentSelectedPos);
        }		
    }

	/**********************************************************************************************************
	 * Private method: get pageNum and the corresponding span element according to current match selectedPos
	 * parameter: @selectedPos : 
	 *							index of current Selected match in this.matches[]
	 * return Value: an object that contains pageNum, corresponding span element, corresponding highligh span element						
	************************************************************************************************************/
    getPageInfoBySelectedPos(selectedPos) {
        let currentSelectedPage = 1;
        while (selectedPos > this.currentMatches[currentSelectedPage]) {
            currentSelectedPage++;
        }
		let match = this.matches[selectedPos - 1];
        let currentSelectedPageTextDivs = document.querySelector('.page[data-page-number="' + currentSelectedPage + '"] .textLayer').childNodes;
        let spanObj = currentSelectedPageTextDivs[match.begin.divIdx];
        let highlightSpanObj = spanObj.querySelectorAll("span")[match.spanIdx];
        return { page: currentSelectedPage, spanObj: spanObj, highlightSpanObj: highlightSpanObj };
    }

	/*****************************************************************************************************
	 * Private Method:
	 ******************************************************************************************************/
    handleSelected(selectedPos, operate) {
        console.log("selectedPos: " + selectedPos + "    operate: " + operate);

        let className = (this.highLighted) ? "selected" : "highlight selected";

        // get the pageNum and span element of currentMatch item 			
        let pageInfo = this.getPageInfoBySelectedPos(selectedPos);
        console.log("pageInfo.highlightSpanObj:  " + pageInfo.highlightSpanObj);
        console.log(operate);
        if (operate == "remove") {
            pageInfo.highlightSpanObj.classList.remove(className);
        } else if (operate == "add") {
            pageInfo.highlightSpanObj.classList.add(className);
        }
    }

    /***********************************************************************************************************
	 * Public Method: find previous or next: 1: clear currentSelected match
	 *										 2: highlight the next currentSelected match according @isNext
	 * parameter:	isNext: true represents next matches
	************************************************************************************************************/
    getSelected(isNext = true) {
		if(isNext && this.currentSelectedPos >=  this.totalMatches) {
			return ;
		}
		if(!isNext && this.currentSelectedPos == 1) {
			return ;
		}
		
		this.handleSelected(this.currentSelectedPos, "remove");	// 清除当前匹配项

        if (isNext) {
            this.currentSelectedPos++;
        } else {
            this.currentSelectedPos--;
        }

        this.handleSelected(this.currentSelectedPos, "add");	// 选中下个匹配项
        this.updateResultsCounts(this.currentSelectedPos, this.totalMatches);
        this.updatePage(this.currentSelectedPos);
    }
	
}

function getViewerConfiguration() {
    return {
        findBar: {
            bar: document.getElementById("findbar"),
            toggleButton: document.getElementById("viewFind"),
            findField: document.getElementById("findInput"),
            highlightAllCheckbox: document.getElementById("findHighlightAll"),	// input: type is checkbox
            caseSensitiveCheckbox: document.getElementById("findMatchCase"),
            entireWordCheckbox: document.getElementById("findEntireWord"),
            findMsg: document.getElementById("findMsg"),
            findResultsCount: document.getElementById("findResultsCount"),
            findPreviousButton: document.getElementById("findPrevious"),
            findNextButton: document.getElementById("findNext"),
			viewer : document.getElementById("viewer"),
			mainContainer : document.getElementById("mainContainer")
        },
    }
}

// should be called in main 
function initFind() {
    const config = getViewerConfiguration();
    const MATCHDISPLAY = 200;
    let item = new PDFFind(config.findBar, MATCHDISPLAY);
}


// singlePageMode state
let g_singlePageMode = false;

class SinglePageMode {
	constructor(options) {
		this.opened = false;	
		this.singlePageButton = options.singlePageButton;
		// add EventListener of 'click' of singPageModeButton
		this.singlePageButton.addEventListener("click", ()=>{
			this.toggle();
		});
	}
	
	open() 
	{
        if (!this.opened) {
            this.opened = true;
			console.log("singlePageMode open");
			g_singlePageMode = true;
			
			openSinglePageMode();
        }
    }

    close() 
	{
        if (!this.opened) {
            return;
        }
        this.opened = false;
		console.log("singlePageMode close");
		g_singlePageMode = false;
    }

    toggle() 
	{
        if (this.opened) {
            this.close();
        } else {
            this.open();
        }
    }
}

function initSinglePageMode()
{
	let config = { singlePageButton : document.getElementById("zoomOut")};
	let singPageObj = new SinglePageMode(config);
}

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

function setPrintButton(){
	const printFileButton = document.getElementById("print");
    printFileButton.addEventListener('click', function (event) {
        console.log("print is executing");
        window.print();
    });
}


function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen(); 
      }
    }
}

function setFullScreenButton(){
    let presentationModeButton = document.getElementById("presentationMode");
    presentationModeButton.addEventListener('click', toggleFullScreen);
}

// function drawText() {
//     let requestURL = 'data/page.json';
//     let request = new XMLHttpRequest();
//     request.open('GET', requestURL);
//     request.responseType = 'text';
//     request.send();
//     request.onload = function () {
//         let jsonText = request.response;
//         // console.log("jsonTextObject", jsonText);
//         let jsonTextObject = JSON.parse(jsonText);
//         console.log("line_count:", jsonTextObject.line_count);
//         let pageSpan = document.getElementById("pageText");
//         pageSpan.innerHTML = "";
//         let textLines = jsonTextObject.text_lines;
//         var c = document.getElementById("pageCanvas");
//         var ctx = c.getContext("2d");

//         for (let i = 0; i < textLines.length; i++) {
//             console.log("i:", i);
//             let textLine = textLines[i];
//             let spanObject = document.createElement("span");
//             console.log("xleft:", multiBy(textLine.x_lefts[0]));
//             spanObject.style.left = multiBy(textLine.x_lefts[0]) + "px";
//             spanObject.style.top = multiBy(textLine.y_max) + "px";
//             spanObject.style.fontSize = multiBy(textLine.char_width) + "px";
//             spanObject.style.fontFamily = "serif";
//             spanObject.style.transform = "scaleX(1)";
//             var chars = "";
//             var charsObject = textLine.text_line_text;
//             for (let j = 0; j < charsObject.length; j++) {
//                 chars += String.fromCharCode(charsObject[j]);
//             }
//             ctx.font = multiBy(textLine.char_width) + "px serif";
//             var textWidth = ctx.measureText(chars).width;
//             var xLefts = textLine.x_lefts;
//             // console.log("xLefts:", xLefts);
//             var canvasWidth = xLefts[xLefts.length - 1] - xLefts[0] + textLine.char_width;
//             canvasWidth = multiBy(canvasWidth);
//             console.log("textWidth:", textWidth, "canvasWidth:", canvasWidth);
//             var scaleX = canvasWidth / textWidth;
//             console.log("scaleX:", scaleX);
//             spanObject.style.transform = "scaleX(" + scaleX + ")";
//             spanObject.innerText = chars;
//             pageSpan.appendChild(spanObject);
//         }
//     };
// }

function hideNotUsedButton() {
    const needHiddens = [
        // "print",
        "download",
        "openFile",
        // "presentationMode",
        "viewBookmark",
        "secondaryToolbarToggle",
        // "toolbarSidebar",
        "viewAttachments",
        "findbarOptionsTwoContainer",
        "findbarOptionsOneContainer",
        "scaleSelectContainer"

    ];
    for (const element of needHiddens) {
        document.getElementById(element).style.display = "none";
    }
}

// function nextPage() {
//     let a = document.createElement("a");
//     a.href = "#page=3";
//     a.setAttribute("data-page-number", 3);
//     a.click();
// }

function initViewer() {
    console.log("initViewer");
    // hideNotUsedButton();
    setSideBar();
    setPrintButton();
    setFullScreenButton();
    initFind();
	initSinglePageMode();
    // let netPageButton = document.getElementById("next");
    // netPageButton.addEventListener("click", nextPage);
}

function createOutlineItemElement(pageNumber, titleText, hasChildren){
//    console.log("hasChildren:", hasChildren);
    let outlineElement = document.createElement("div");
   
    if(hasChildren){
        let beforeElement = document.createElement("div");
        beforeElement.classList.add("outlineItemToggler");
        // beforeElement.classList.add("outlineItemsHidden");
        outlineElement.appendChild(beforeElement);
    }
    
    outlineElement.classList.add("outlineItem");
    let aElement = document.createElement("a");
    aElement.href = "#zpage-number-" + pageNumber;
    aElement.innerHTML = titleText;
    outlineElement.appendChild(aElement);
   
    return outlineElement;
   
}

function getCatalogTitleText(titleJSON){
    // console.log("titleJSON:", titleJSON);
    // console.log("title length:", titleJSON.length);
    let titleText = "";
    for(let i = 0; i < titleJSON.length; i++){
        // console.log("title text:", String.fromCharCode(titleJSON.titleText[i]));
        titleText += String.fromCharCode(titleJSON.titleText[i]);
    }
    // console.log("titleText:", titleText);
    return titleText;
}



function parseOutlineJSON(outlineJSONObject){
    let titleText = getCatalogTitleText(outlineJSONObject.title);
    console.log("pageNumber:", outlineJSONObject.destPageNumber);
    let pageNumber = outlineJSONObject.destPageNumber;
    let outlineElement = createOutlineItemElement(pageNumber, titleText, outlineJSONObject.children);
    if(outlineJSONObject.children){
        let childElement = parseOutlineJSON(outlineJSONObject.children);
        // outlineElement.insertBefore()
        outlineElement.appendChild(childElement);
    }

    let siblings = outlineJSONObject.siblings;
    for(let i = 0; i < siblings.length; i ++)
    {
        console.log("siblings[i].destPageNumber:", siblings[i].destPageNumber);
        let siblingElement = createOutlineItemElement(siblings[i].destPageNumber,  getCatalogTitleText(siblings[i].title), 
            siblings[i].children);
        if(siblings[i].children){
            let siblingChildrenElement = parseOutlineJSON(siblings[i].children);
            siblingElement.appendChild(siblingChildrenElement);
        }
        outlineElement.append(siblingElement);
    }
    return outlineElement;
}

function drawOutline(outlineJSONString){
    // console.log(outlineJSONString);
    let outlineJSONObject = JSON.parse(outlineJSONString);
    let outlineElment = parseOutlineJSON(outlineJSONObject);
    let outlineViewElement = document.getElementById("outlineView");
    
    outlineViewElement.appendChild(outlineElment);
    console.log(outlineViewElement);
}

function initOutline(outlineJSONUrl){
    // let requestURL = pageTextJsonUrl;
    console.log("initOutline start");
    let request = new XMLHttpRequest();
    request.open('GET', outlineJSONUrl);
    request.responseType = 'text'; 
    request.send();
    request.onload = function () {

        // console.log("pageNumber:", pageNumber);
        drawOutline(request.response);
    }
    console.log("initOutline end");
}


	// bookInfo 
	let bookInfo = {
		pageUrlArray : [
        {
            pageNumber: 1,
            pageImageUrl: 'data/1.jpg',
            pageTextJsonUrl: 'data/1.json'
        },
        {
            pageNumber: 2,
            pageImageUrl: 'data/2.jpg',
            pageTextJsonUrl: 'data/2.json'
            // pageAnnotationUrl: 'data/2-notes.xml'
        },
        {
            pageNumber: 3,
            pageImageUrl: 'data/3.jpg',
            pageTextJsonUrl: 'data/3.json'
        },
        {
            pageNumber: 4,
            pageImageUrl: 'data/4.jpg',
            pageTextJsonUrl: 'data/4.json'
        },
        {
            pageNumber: 5,
            pageImageUrl: 'data/5.jpg',
            pageTextJsonUrl: 'data/5.json'
        }
		],
		outlineURL : "data/mupdf-catalog.json"
	};

function drawBook(bookInfo){
	console.log("drawBook start");

    initOutline(bookInfo.outlineURL);
    
    for(let i = 0; i < bookInfo.pageUrlArray.length; i ++){
        createPage(bookInfo.pageUrlArray[i].pageNumber);
        createSidebar(bookInfo.pageUrlArray[i].pageNumber, bookInfo.pageUrlArray[i].pageImageUrl);
        drawPage(bookInfo.pageUrlArray[i].pageNumber, bookInfo.pageUrlArray[i].pageImageUrl,
             bookInfo.pageUrlArray[i].pageTextJsonUrl, bookInfo.pageUrlArray[i].pageAnnotationUrl);
    }
    setScrollEvent();
    initPageNumber();
    setPageNextPreviouseButton();
    console.log("drawBook end");
}


function zrun(){
    initViewer();
    drawBook(bookInfo);
}

zrun();

function createPage(pageNumber){
    let viewer = document.getElementById("viewer");
    let page = document.createElement("div");
    page.className = "page";
    page.setAttribute("data-page-number", pageNumber);
    page.setAttribute("id", 'zpage-number-' + pageNumber);
    page.style.width = "800px";
    page.style.height = "1000px";
    // console.log("page:", page);
    let zpage = new ZPage();
    zpage.pageNumber = pageNumber;
    zpage.width = 0;
    zpage.height = 0;
    g_zpages.push(zpage);
    viewer.appendChild(page);

}

function drawTextLayer(page, pageImg, pagesJsonObject, ctx ){
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
        // console.log("j:", j);
        let textLine = textLines[j];
        let spanObject = document.createElement("span");
        // console.log("xleft:", multiBy(textLine.xMin));
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
        // console.log("textWidth:", textWidth, "canvasWidth:", canvasWidth);
        var scaleX = canvasWidth / textWidth;
        // console.log("scaleX:", scaleX);
        spanObject.style.transform = "scaleX(" + scaleX + ")";
        spanObject.innerText = chars;
        textLayer.appendChild(spanObject);
    }
}

function drawImage(pageNumber, pageImageUrl, pageAnnotationUrl, jsonText){
    const pagesJsonObject = JSON.parse(jsonText);
    let pageImg = new Image();
    pageImg.src = pageImageUrl;
    pageImg.onload = function () {
        let page = document.getElementById('zpage-number-' + pageNumber);
        page.style.width = pageImg.width + "px";
        page.style.height = pageImg.height + "px";

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
        
		
		pageCanvas.setAttribute("aria-label", "页码 " + pageNumber);

        pageCanvasWrapper.appendChild(pageCanvas);
        // ctx.rotate(60* Math.PI/180);
        let ctx = pageCanvas.getContext("2d");
        // console.log("ctx:", ctx);
        ctx.save();
        var width = pageImg.width;        
        var x = 0;
        var y = 0;
        var height = pageImg.height;
        g_zpages[pageNumber - 1].width = pageImg.width;
        g_zpages[pageNumber - 1].height = pageImg.height;
        // console.log("pageHeight:", height);
        ctx.scale(1, -1);
        ctx.drawImage(this, x, -height - y, width, height)
        drawTextLayer(page, pageImg, pagesJsonObject, ctx);
        ctx.restore();
        // page.appendChild(pageCanvas);
        if(pageAnnotationUrl != undefined){
            drawAnnotation(page, pageNumber, pageAnnotationUrl);
        }
    };     
}

function createSidebar(pageNumber, pageImageUrl){
    console.log("createSidebar start");
    let thumbnailViewElement = document.getElementById("thumbnailView");
    let aElement = document.createElement("a");
    aElement.href = "#zpage-number-" + pageNumber;
    aElement.title = "页码"+ pageNumber;
    let thumbnailElement = document.createElement("thumbnail");
    thumbnailElement.classList.add("thumbnail");
    thumbnailElement.setAttribute("data-page-number", pageNumber);
    let thumbnailSelectionRingElement = document.createElement("div");
    thumbnailSelectionRingElement.classList.add("thumbnailSelectionRing");
    thumbnailSelectionRingElement.setAttribute("style", "width: 100px; height: 128px;");
    let imgElement = document.createElement("img");
    imgElement.classList.add("thumbnailImage");
    imgElement.classList.add("zthumbnailImage");
    imgElement.src = pageImageUrl;
    imgElement.setAttribute("style", "width: 98px; height:126px;");
    imgElement.setAttribute("aria-label", "页面" + pageNumber + "缩略图");
    thumbnailSelectionRingElement.appendChild(imgElement);
    
    aElement.appendChild(thumbnailElement);
    aElement.appendChild(thumbnailSelectionRingElement);
    thumbnailViewElement.appendChild(aElement);
    console.log("createSidebar end");
}

function drawPage(pageNumber, pageImageUrl, pageTextJsonUrl, pageAnnotationUrl) {
    console.log("drawPage start");
    console.log("pageNumber:", pageNumber);
    let requestURL = pageTextJsonUrl;
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'text'; 
    request.send();
    request.onload = function () {
        drawImage(pageNumber, pageImageUrl, pageAnnotationUrl, request.response);
    }
    console.log("drawPage end");
}

function setPageNumber(){
    document.getElementById("pageNumber").value = g_currentPageNumber;
}

function calulatePageNumber(){
    let viewerContainerElement = document.getElementById("viewerContainer");
    let scrollTop = viewerContainerElement.scrollTop;
    console.log("scrollTop:", scrollTop);
    let y = 0;
    console.log("g_zpages.length:", g_zpages.length);
    for(let i = 0; i < g_zpages.length; i ++){
        y += g_zpages[i].height + 10;
        if(scrollTop <= y){
            g_currentPageNumber = i + 1;
            break;
        }
    }
}

//side bar state 
let g_sidebar_isOpend = false;
let g_thumbnail_isOpened = false;
let g_outline_isOpened = false;

function setSideBar(){
    let sideBarToggleButton = document.getElementById("sidebarToggle");
    let outerContainerElement = document.getElementById('outerContainer');
    sideBarToggleButton.addEventListener('click', function(){
        if(g_sidebar_isOpend == false){
            g_sidebar_isOpend = true;
            sideBarToggleButton.classList.add("toggled");
            outerContainerElement.classList.add("sidebarOpen");
        }
        else{   
            g_sidebar_isOpend = false;
            sideBarToggleButton.classList.remove("toggled");
            outerContainerElement.classList.add("sidebarMoving");
            outerContainerElement.classList.remove("sidebarOpen");
        }
    });

    let viewThumbnailButton = document.getElementById('viewThumbnail');
    let viewOutlineButton = document.getElementById('viewOutline');
    let thumbnailViewElement = document.getElementById('thumbnailView');
    let outlineViewElement = document.getElementById('outlineView');
    viewThumbnailButton.addEventListener('click', function(){
            g_thumbnail_isOpened = true;
            g_outline_isOpened = false;
            viewThumbnailButton.classList.add('toggled');
            viewOutlineButton.classList.remove('toggled');
            thumbnailViewElement.classList.remove('hidden');
            outlineViewElement.classList.add('hidden');
      
    });
    viewOutlineButton.addEventListener('click', function(){
            g_outline_isOpened = true;
            g_thumbnail_isOpened = false;
            viewOutlineButton.classList.add('toggled');
            viewThumbnailButton.classList.remove('toggled');
            thumbnailViewElement.classList.add('hidden');
            outlineViewElement.classList.remove('hidden');
    });

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

function openSinglePageMode() {
    // 10 represents top margin + border of each image 
    let viewerContainerElement = document.getElementById("viewerContainer");
    let prePageHeight = 0, currentPageHeight = 0, visiableHeight = viewerContainerElement.clientHeight;
    for (let i = 0; i < g_currentPageNumber - 1; i++) {
        prePageHeight += g_zpages[i].height + 10;
    }
    currentPageHeight = prePageHeight + g_zpages[g_currentPageNumber - 1].height + 10;
	
	// dealwith pagedown
    if (viewerContainerElement.scrollTop + viewerContainerElement.clientHeight > currentPageHeight + 10) {
        viewerContainerElement.scrollTop = currentPageHeight + 1;	// +1为了更新g_currentPageNum为下一页
    }
	// dealwith pageup
    if (viewerContainerElement.scrollTop < prePageHeight) {
        viewerContainerElement.scrollTop = prePageHeight - visiableHeight;
    }
}

function setScrollEvent(){
    let viewerContainerElement = document.getElementById("viewerContainer");
    viewerContainerElement.addEventListener("scroll", function(event){
		if(g_singlePageMode == true) {
			openSinglePageMode();
		}
		calulatePageNumber();
        setPageNumber();
        updatePageButton();
    });
}

function initPageNumber(){
    console.log("g_zpages.length:", g_zpages.length);
    let numPagesElement = document.getElementById("numPages");
    numPagesElement.textContent = "/" + g_zpages.length;
}


function setPageNextPreviouseButton(){
    let previouseButton = document.getElementById("previous");
    let nextButton = document.getElementById("next");
    nextButton.addEventListener("click", function(){
        calulatePageNumber();
        let x = 0;
        let y = 10;
        console.log("g_currentPageNumber:", g_currentPageNumber);
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
        let x = 0;
        let y = 10;
        for(let i = 0; i < g_currentPageNumber - 2; i++){
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


// function drawTextLayer(zDocumentObj, pageNumber, page, pageImg, ctx){
//     let lineCount = zDocumentObj.getLineCount(pageNumber);
//     console.log("lineCount:", lineCount);
//     let textLayer = document.createElement("div");
//     textLayer.className = "textLayer";
//     textLayer.style.width = pageImg.width + "px";
//     textLayer.style.height = pageImg.height + "px";
//     page.appendChild(textLayer);
//     zpage = new ZPage();
//     zpage.pageNumber = pageNumber;
//     zpage.width = pageImg.width;
//     zpage.height = pageImg.height;
//     g_zpages.push(zpage);
//     for (let j = 0; j < lineCount; j++) {
//         let charCount = zDocumentObj.getCharCount(pageNumber, j);
//         if (charCount <= 0) {
//             continue;
//         }
//         let charWidth = zDocumentObj.getCharWidth(pageNumber, j);
//         console.log("charWidth:", charWidth);
//         let xMin = zDocumentObj.getCharXLeft(pageNumber, j, 0);
//         let xMax = zDocumentObj.getCharXLeft(pageNumber, j, charCount - 1) + charWidth;
//         let yMax = zDocumentObj.getCharYMax(pageNumber, j);

//         let spanObject = document.createElement("span");
//         // let xLeft = zDocumentObj.getLineCount(i, j);
//         console.log("xleft:", multiBy(xMin));
//         spanObject.style.left = multiBy(xMin) + "px";
//         spanObject.style.top = multiBy(yMax) + "px";
//         spanObject.style.fontSize = multiBy(charWidth) + "px";
//         spanObject.style.fontFamily = "serif";
//         spanObject.style.transform = "scaleX(1)";
//         var chars = "";
//         for(let k = 0; k < charCount; k ++){
//             chars += String.fromCharCode(zDocumentObj.getCharValue(pageNumber, j, k));
//         }
//         ctx.font = multiBy(charWidth) + "px serif";
//         var textWidth = ctx.measureText(chars).width;
//         // var textWidth = 200;
//         // var xLefts = textLine.x_lefts;
//         // console.log("xLefts:", xLefts);
//         var canvasWidth = xMax - xMin;
//         canvasWidth = multiBy(canvasWidth);
//         console.log("textWidth:", textWidth, "canvasWidth:", canvasWidth);
//         var scaleX = canvasWidth / textWidth;
//         console.log("scaleX:", scaleX);
//         spanObject.style.transform = "scaleX(" + scaleX + ")";
//         spanObject.innerText = chars;
//         textLayer.appendChild(spanObject);
//     }
// }

// function imageOnLoad() {
//     let pageCanvasWrapper = document.createElement("div");
//     pageCanvasWrapper.className = "canvasWrapper";
//     pageCanvasWrapper.style.width = this.width + "px";
//     pageCanvasWrapper.style.height = this.height + "px";
//     this.page.style.width = this.width + "px";
//     this.page.style.height = this.height + "px";
//     this.page.appendChild(pageCanvasWrapper);

//     let pageCanvas = document.createElement("canvas");
//     pageCanvas.width = this.width;
//     pageCanvas.height = this.height;
//     pageCanvas.style.width = this.width + "px";
//     pageCanvas.style.height = this.height + "px";
//     pageCanvas.setAttribute("aria-label", "页码 " + this.pageNumber);

//     pageCanvasWrapper.appendChild(pageCanvas);
//     // ctx.rotate(60* Math.PI/180);
//     let ctx = pageCanvas.getContext("2d");
//     // console.log("ctx:", ctx);
//     ctx.save();
//     // this.style.transform = 'rotate('+current+'deg)'
//     // var canvasWidth = pageCanvas.width;
//     // console.log("canvasWidth:", canvasWidth);
//     var width = this.width;
//     // console.log("pageWidth:", width);
//     var x = 0;
//     var y = 0;
//     var height = this.height;
//     // console.log("pageHeight:", height);
//     // ctx.scale(1, -1);
//     ctx.scale(0.12, -0.12);
//     ctx.drawImage(this, x, -height - y, width, height);
//     drawTextLayer(this.zDocumentObj, this.pageNumber , this.page, this, ctx);
//     ctx.restore();
// }


// document.addEventListener("onload", drawPage);


