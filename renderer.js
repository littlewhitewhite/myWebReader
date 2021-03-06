"use strict";
import {multiBy} from "./util.js";
import {drawAnnotation} from "./annotation.js";

export {zrun}
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
                    if (e.target === this.findField) {
                        this.getSelected(!e.shiftKey);
                    }
                    break;
                case 27: // Escape
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
            this.getSelected(false);
        });

        this.findNextButton.addEventListener("click", () => {
            this.getSelected(true);
        });
		// if highlightAll is enabled in html, then attach event.
		if(this.highlightAll) {
			this.highlightAll.addEventListener("click", () => {
				this.updateHighlightMatches(this.findField.value, this.highlightAll.checked);
			});
		}
        this.caseSensitive.addEventListener("click", () => {
            this.findInFile();
        });

		// if entireWord is enabled in html, then attach event.
		if(this.entireWord) {
			this.entireWord.addEventListener("click", () => {
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
	 *			@query: the word to find
	 *			@isHighlightMatches: whether or not highlight word
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
					query = query.toLowerCase();
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
        if (!this.findResultsCount) {
            return; // No UI control is provided.
        }
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
        findResultsCount.textContent = matchesCountMsg;
        this.findResultsCount.classList.toggle("hidden", !total);
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
        let className = (this.highLighted) ? "selected" : "highlight selected";

        // get the pageNum and span element of currentMatch item 			
        let pageInfo = this.getPageInfoBySelectedPos(selectedPos);
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
		// add EventListener of 'click' on singPageModeButton
		this.singlePageButton.addEventListener("click", ()=>{
			this.toggle();
		});
	}
	
	open() 
	{
        if (!this.opened) {
            this.opened = true;
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
	let config = { singlePageButton : document.getElementById("openFile")};
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
        window.print();
    });
}

let curScaleFactorIdx = 1;		// 100% by default
// zoomIn or zoomOut 
function zoomScale(scale)
{
	let canvas = document.querySelectorAll("#viewer .page .canvasWrapper canvas");
	let textLayers = document.querySelectorAll("#viewer .page .textLayer");
	let selectScale = document.getElementById("selectdScale");
	let scaleFactors = [75, 100, 125];
	let isZoomIn = false;
	
	if(this.id == "zoomIn") {
		if(curScaleFactorIdx < scaleFactors.length - 1) {
			isZoomIn = true;
			scale = scaleFactors[curScaleFactorIdx + 1];
		}
		else 
			return;
	} else if(this.id == "zoomOut") {
		if(curScaleFactorIdx > 0) {
			scale = scaleFactors[curScaleFactorIdx - 1];
		}
		else 
			return;
	}
	
	// zoom canvas layer
	for(let item of canvas) {
		item.style.width = item.parentNode.style.width =  item.parentNode.parentNode.style.width = 
			parseInt(parseInt(item.style.width) * scale / scaleFactors[curScaleFactorIdx]) + "px";
		item.style.height = item.parentNode.style.height =  item.parentNode.parentNode.style.height = 
			parseInt(parseInt(item.style.height) * scale / scaleFactors[curScaleFactorIdx]) + "px";
	}
	// zoom textLayer
	for(let item of textLayers) {
		item.style.width = parseInt(parseInt(item.style.width) * scale / scaleFactors[curScaleFactorIdx]) + "px";
		item.style.height = parseInt(parseInt(item.style.height) * scale / scaleFactors[curScaleFactorIdx]) + "px";
		for(let span of item.childNodes) {
			span.style.left = parseFloat(parseFloat(span.style.left) * scale / scaleFactors[curScaleFactorIdx]) + "px";
			span.style.top = parseFloat(parseFloat(span.style.top) * scale / scaleFactors[curScaleFactorIdx]) + "px";
			span.style.fontSize = parseFloat(parseFloat(span.style.fontSize) * scale / scaleFactors[curScaleFactorIdx]) + "px";
		}
	}
	selectScale.text = scale + "%";
	
	if(isZoomIn) {
		curScaleFactorIdx++;
	} else {
		curScaleFactorIdx--;
	}
}

// zoomIn just 125% in case of blurring of pictures
function initZoom() {
	const zoomInButton = document.getElementById("zoomIn");
	const zoomOutButton = document.getElementById("zoomOut");
	
	zoomInButton.addEventListener("click", zoomScale );
	zoomOutButton.addEventListener("click", zoomScale);
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

function initViewer() {
    setSideBar();
    setPrintButton();
    setFullScreenButton();
    initFind();
	initSinglePageMode();
	initZoom();
}

function createOutlineItemElement(pageNumber, titleText, hasChildren){
    let outlineElement = document.createElement("div");
   
    if(hasChildren){
        let beforeElement = document.createElement("div");
        beforeElement.classList.add("outlineItemToggler");
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
    let titleText = "";
    for(let i = 0; i < titleJSON.length; i++){
        titleText += String.fromCharCode(titleJSON.titleText[i]);
    }
    return titleText;
}

function parseOutlineJSON(outlineJSONObject){
    let titleText = getCatalogTitleText(outlineJSONObject.title);
    let pageNumber = outlineJSONObject.destPageNumber;
    let outlineElement = createOutlineItemElement(pageNumber, titleText, outlineJSONObject.children);
    if(outlineJSONObject.children){
        let childElement = parseOutlineJSON(outlineJSONObject.children);
        outlineElement.appendChild(childElement);
    }

    let siblings = outlineJSONObject.siblings;
    for(let i = 0; i < siblings.length; i ++)
    {
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
    let outlineJSONObject = JSON.parse(outlineJSONString);
    let outlineElment = parseOutlineJSON(outlineJSONObject);
    let outlineViewElement = document.getElementById("outlineView");
    
    outlineViewElement.appendChild(outlineElment);
}

function initOutline(outlineJSONUrl){
    let request = new XMLHttpRequest();
    request.open('GET', outlineJSONUrl);
    request.responseType = 'text'; 
    request.send();
    request.onload = function () {
        drawOutline(request.response);
    }
}

function drawBook(bookInfo){
    initOutline(bookInfo.outlineURL);
    
    for(let i = 0; i < bookInfo.pageUrlArray.length; i ++){
        createPage(bookInfo.pageUrlArray[i].pageNumber);
        drawPage(bookInfo.pageUrlArray[i].pageNumber, bookInfo.pageUrlArray[i].pageImageUrl,
				bookInfo.pageUrlArray[i].pageImageDir, bookInfo.pageUrlArray[i].pageTextJsonUrl, 
				bookInfo.pageUrlArray[i].pageAnnotationUrl);
		//createSidebar(bookInfo.pageUrlArray[i].pageNumber);
    }
    setScrollEvent();
    initPageNumber();
    setPageNextPreviouseButton();
}

function createPage(pageNumber){
    let viewer = document.getElementById("viewer");
    let page = document.createElement("div");
    page.className = "page";
    page.setAttribute("data-page-number", pageNumber);
    page.setAttribute("id", 'zpage-number-' + pageNumber);
    page.style.width = "800px";
    page.style.height = "1000px";
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
    let textLines = pagesJsonObject.textLines;
    for (let j = 0; j < textLines.length; j++) {
        let textLine = textLines[j];
        let spanObject = document.createElement("span");
        spanObject.style.left = multiBy(textLine.xMin) + "px";
        spanObject.style.top = multiBy(textLine.yMax) + "px";
        spanObject.style.fontSize = multiBy(textLine.charWidth) + "px";
        spanObject.style.fontFamily = "serif";
        spanObject.style.transform = "scaleX(1)";
        let chars = "";
        let charsObject = textLine.chars;

        for (let k = 0; k < charsObject.length; k++) {
            chars += String.fromCharCode(charsObject[k]);
        }

        ctx.font = multiBy(textLine.charWidth) + "px serif";
        let textWidth = ctx.measureText(chars).width;
		let canvasWidth =  textLine.xMax - textLine.xMin;
        canvasWidth = multiBy(canvasWidth);
		textLine.charWidth = multiBy(textLine.charWidth);
        let scaleX = canvasWidth / textWidth;
        spanObject.style.transform = "scaleX(" + scaleX + ")";
        spanObject.innerText = chars;
        textLayer.appendChild(spanObject);
    }
}

let imageDir = Object.freeze({"NORMAL":0, "MIRROR_X":1, "MIRROR_Y":2, "MIRROR_XY":3});

function drawImage(pageNumber, pageImageUrl, pageImageDir, pageAnnotationUrl, jsonText){
    const pagesJsonObject = JSON.parse(jsonText);
    let pageImg = new Image();
    pageImg.src = pageImageUrl;
    pageImg.onload = function () {
		let width = pageImg.width;        
        let height = pageImg.height;
        let page = document.getElementById('zpage-number-' + pageNumber);
        page.style.width = width + "px";
        page.style.height = height + "px";		
        let pageCanvasWrapper = document.createElement("div");
        pageCanvasWrapper.className = "canvasWrapper";
        pageCanvasWrapper.style.width = width + "px";
        pageCanvasWrapper.style.height = height + "px";
        
		page.appendChild(pageCanvasWrapper);

        let pageCanvas = document.createElement("canvas");
        pageCanvas.width = width;
        pageCanvas.height = height;
        pageCanvas.style.width = width + "px";
        pageCanvas.style.height = height + "px";
		pageCanvas.setAttribute("aria-label", "pageNumber " + pageNumber);

        pageCanvasWrapper.appendChild(pageCanvas);

        let ctx = pageCanvas.getContext("2d");
        ctx.save();
        let x = 0;	// initial offsetX when it starts to drawImage
        let y = 0;
        g_zpages[pageNumber - 1].width = width;
        g_zpages[pageNumber - 1].height = height;
		if(pageImageDir == imageDir.NORMAL) {
			ctx.drawImage(this, x, y, width, height);
		} else if(pageImageDir == imageDir.MIRROR_X) {
			ctx.scale(-1, 1);        
			ctx.drawImage(this, -width - x, 0, width, height);	
		}else if(pageImageDir == imageDir.MIRROR_Y) {
			ctx.scale(1, -1);        
			ctx.drawImage(this, x, -height - y, width, height);
		} else if(pageImageDir == imageDir.MIRROR_XY) {
			ctx.scale(-1, -1);        
			ctx.drawImage(this, -width - x, -height - y, width, height);
		}
        drawTextLayer(page, pageImg, pagesJsonObject, ctx);
        ctx.restore();
        if(pageAnnotationUrl != undefined){
            drawAnnotation(page, pageNumber, pageAnnotationUrl);
        }
		
		createSidebar(pageNumber);
    };     
}

function createSidebar(pageNumber){
    let thumbnailViewElement = document.getElementById("thumbnailView");
    let aElement = document.createElement("a");
    aElement.href = "#zpage-number-" + pageNumber;
    aElement.title = "pageNumber"+ pageNumber;
    let thumbnailElement = document.createElement("thumbnail");
    thumbnailElement.classList.add("thumbnail");
    thumbnailElement.setAttribute("data-page-number", pageNumber);
    let thumbnailSelectionRingElement = document.createElement("div");
    thumbnailSelectionRingElement.classList.add("thumbnailSelectionRing");
    thumbnailSelectionRingElement.setAttribute("style", "width: 100px; height: 128px;");
	
	//let pageNumberValue = "pageNumber " + pageNumber;
	let canvas = document.querySelector("[aria-label = '" + "pageNumber " + pageNumber+ "']");
	
	let imgElement = document.createElement("img");
    imgElement.classList.add("thumbnailImage");
    imgElement.classList.add("zthumbnailImage");
    imgElement.src = canvas.toDataURL();
    imgElement.setAttribute("style", "width: 98px; height:126px;");
    imgElement.setAttribute("aria-label", "页面" + pageNumber + "缩略图");
    thumbnailSelectionRingElement.appendChild(imgElement);
    
    aElement.appendChild(thumbnailElement);
    aElement.appendChild(thumbnailSelectionRingElement);
    thumbnailViewElement.appendChild(aElement);
}

function drawPage(pageNumber, pageImageUrl, pageImageDir, pageTextJsonUrl, pageAnnotationUrl) {
    let requestURL = pageTextJsonUrl;
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'text'; 
    request.send();
    request.onload = function () {
        drawImage(pageNumber, pageImageUrl, pageImageDir, pageAnnotationUrl, request.response);
    }
}

function setPageNumber(){
    document.getElementById("pageNumber").value = g_currentPageNumber;
}

function calulatePageNumber(){
    let viewerContainerElement = document.getElementById("viewerContainer");
    let scrollTop = viewerContainerElement.scrollTop;
    let y = 0;
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
        for(let i = 0; i < g_currentPageNumber; i ++){
            y += g_zpages[i].height + 10;
        }
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
        g_currentPageNumber --;
        setPageNumber();
        let viewerContainerElement = document.getElementById("viewerContainer");
        viewerContainerElement.scrollTo(x, y);
        if(g_currentPageNumber == 0){
            previouseButton.disabled = true;
        }
    });    
}

function zrun(bookInfo){
    initViewer();
    drawBook(bookInfo);
}
