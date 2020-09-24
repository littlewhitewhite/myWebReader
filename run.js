import {zrun} from "./rendererConfusion.js"

// bookInfo 
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
		pageTextJsonUrl: 'data/2.json'
	},
	{
		pageNumber: 3,
		pageImageUrl: 'data/3.jpg',
		pageImageDir: 2,
		pageTextJsonUrl: 'data/3.json'
	},
	{
		pageNumber: 4,
		pageImageUrl: 'data/4.jpg',
		pageImageDir: 2,
		pageTextJsonUrl: 'data/4.json'
	},
	{
		pageNumber: 5,
		pageImageUrl: 'data/5.jpg',
		pageImageDir: 2,
		pageTextJsonUrl: 'data/5.json'
	},
	{
		pageNumber: 6,
		pageImageUrl: 'data/6.jpg',
		pageImageDir: 2,
		pageTextJsonUrl: 'data/6.json'
	}
	],
	outlineURL : "data/mupdf-catalog.json"
};

zrun(bookInfo);
