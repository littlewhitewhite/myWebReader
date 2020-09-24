import {zrun} from "./rendererConfusion.js"

let bookInfoLink = {
	pageUrlArray : [
	{
		pageNumber: 1,
		pageImageUrl: 'dataLink/1.jpg',
		pageImageDir: 2,
		pageTextJsonUrl: 'dataLink/1.json'
	},
	{
		pageNumber: 2,
		pageImageUrl: 'dataLink/2.jpg',
		pageImageDir: 2,
		pageTextJsonUrl: 'dataLink/2.json',
		pageAnnotationUrl: 'dataLink/notes.xml'
	},
	{
		pageNumber: 3,
		pageImageUrl: 'dataLink/3.jpg',
		pageImageDir: 2,
		pageTextJsonUrl: 'dataLink/3.json'
	}
	],
	outlineURL : "data/mupdf-catalog.json"
};

zrun(bookInfoLink);