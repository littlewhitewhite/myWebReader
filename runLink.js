import {zrun} from "./renderer.js"


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
		pageAnnotationUrl: 'data/2-notes.xml'
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