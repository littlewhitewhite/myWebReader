# WebReader

A simple reader use in web.

## Table of Contents

[Background](#background)
[Functionss](#functions)
[Usage](#usage)
[What's included](#what's-included)
[Test](#test)

## Background

Provide an interface that include some special functions to the caller to read in web such as a webreader.

## Functions

* renderer and display source images
* pageDown/pageUp and jump to special page
* ZoomIn/ZoomOut (zoomIn at most 125% to avoid blurring)
* Find in file (jump and highLight has been implemented)
* display thumbnail view
* outline (that is directroy tree)
* singlePageMode view
* ReadingMode in PC terminal
* Print
* Show annotates (mostly directory link)
* open annotate link

## Usage

1. import {zrun} from "./renderer.js".
2. define an object that has special [Format](#format) to store bookInfomation.
3. call zrun(@YourBookInfo).

### format
```javascript
/****************************************************************************************
* @pageNumber   : currentPageNumber
* @pageImageUrl : image URL of currentPage
* @pageImageDir : imageDirection of currentPag
*	{0:normal, 1:morror flip on X, 
* 	 2: mirror flip on Y, 3: mirror flip on both X and Y}
* @pageTextJsonUrl: textLayer of currentPage
* @pageAnnotationUrl: annotation info of currentPage
*****************************************************************************************/
let bookInfo = {
	pageUrlArray : [
	{
		pageNumber: 1,				  
		pageImageUrl: 'data/1.jpg',	   
		pageImageDir: 2,			  
		pageTextJsonUrl: 'data/1.json' 
	},
	{
		pageNumber: 2,
		pageImageUrl: 'data/2.jpg',
		pageImageDir: 2,
		pageTextJsonUrl: 'data/2.json',
		pageAnnotationUrl: 'data/2-notes.xml'
	}
	],
	outlineURL : "data/mupdf-catalog.json"
}
```



## What's included

You will find the following directories and files like this:

./</br>
|---data/</br>
	|---1.jpg</br>
	|---1.json</br>
	|---mupdf-catalog.json</br>
|---images/</br>
|---myviewer.html</br>
|---pdf_viewer.css</br>
|---annotation_layer_builder.css</br>
|---text_layer_builder.css</br>
|---viewer.css</br>
|---util.js</br>
|---rendererConfusion.js</br>
|---run.js</br>

## Test

Here are two examples to show viewer  : 
* `myviewer.html` without annotation links
* `myviewerLink.html` with annotation links



