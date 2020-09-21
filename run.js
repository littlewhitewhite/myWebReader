import {zrun} from "./renderer.js"

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
	},
	{
		pageNumber: 6,
		pageImageUrl: 'data/6.jpg',
		pageTextJsonUrl: 'data/6.json'
	}
	],
	outlineURL : "data/mupdf-catalog.json"
};

let bookInfoLink = {
	pageUrlArray : [
	{
		pageNumber: 1,
		pageImageUrl: 'dataLink/1.jpg',
		pageTextJsonUrl: 'dataLink/1.json'
	},
	{
		pageNumber: 2,
		pageImageUrl: 'dataLink/2.jpg',
		pageTextJsonUrl: 'dataLink/2.json'
	},
	{
		pageNumber: 3,
		pageImageUrl: 'dataLink/3.jpg',
		pageTextJsonUrl: 'dataLink/3.json'
	}
	],
	outlineURL : "data/mupdf-catalog.json"
};

zrun(bookInfoLink);
zrun(bookInfo);