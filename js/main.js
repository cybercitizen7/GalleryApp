import { API_URL } from './config.js';
import GalleryModel from './Gallery/GalleryModel.js';
import Options from './Utilities/Options.js';
import GalleryView from './Gallery/GalleryView.js';
import GalleryController from './Gallery/GalleryController.js';

// Store the main containers
// For now it's done statically, we could implement dynamic action with 'ADD NEW GALLERY' button
// where we would dynamically create HTML elements
var galleryContainer1 = document.getElementById('container-1');
//var galleryContainer2 = document.getElementById('container-2');

// GALLERY ONE EXAMPLE
// Initiate all MVC classes
const galleryModel = new GalleryModel(new Options(
  galleryContainer1,    // Container DOM
  API_URL,              // API URL
  true,                 // Loop Panel
  0                     // start Index
));


const galleryView = new GalleryView({
  'sliderWrap' : document.getElementById('slider-wrap-1'),
  'prevBtn' : document.getElementById('prev'),
  'nextBtn' : document.getElementById('next'),
  'paginationSelectors' : document.getElementById('pagination-1')
});

const galleryController = new GalleryController(galleryModel, galleryView);
galleryModel.fetchImages();


// GALLERY TWO EXAMPLE
// ========================================================================================================= //
/*const galleryModel2 = new GalleryModel(new Options(
  galleryContainer2, API_URL, false, 5
));
  
const galleryView2 = new GalleryView({
  'sliderWrap' : document.getElementById('slider-wrap-2'),
  'prevBtn' : document.getElementById('prev-2'),
  'nextBtn' : document.getElementById('next-2'),
  'paginationSelectors' : document.getElementById('pagination-2')
});

const galleryController2 = new GalleryController(galleryModel2, galleryView2);

galleryModel2.fetchImages();*/
// ========================================================================================================= //

// JUST DUPLICATE THE CODE IN HTML AND RESPECTIVELY RENAME CONTAINERS 
// SHOULD SUPPORT AS MANY GALLERIES AS WE WANT
// NOTE that it would be possible to dynamically create also all the HTML,
// say on 'Createw New Gallery' button click -
// but I haven't taken that approach for this Demo.

window.addEventListener('load', () => {
});


