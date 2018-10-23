import EventEmitter from "../Utilities/EventEmitter.js";

export default class GalleryView extends EventEmitter {
    constructor(elements) {
        super();
        this._elements = elements;
    }

    preloadImage(imageArray, index) {
        var _this = this;
        var div = this._elements.sliderWrap.appendChild(document.createElement('DIV'));

        /* 
            My gallery is designed in way that only 1 image is visible at the time (no partially visible images),
            however, if I would adapt my code to include partially visible images, this functions is really neat,/
            because onLoad() I would load the partially visible images sequentially (I know that they are on index + 1 and index - 1)
            Loading sequentally is actually faster for the PRELOADING, so that user sees something fast. Paralel loading of 100's of 
            images would need longer intitial time to load, due bandwidth sharing, but overall, at the end, paralel loading would still
            be a bit quicker. Depends on UX.
        */
        if( imageArray && imageArray.length > index ) {
            var img = new Image();
            img.onload = function() {
                // Image to show is preloaded, now load the rest 
                imageArray.splice(index,1);
                _this.loadRemainingImages(imageArray);             
            }

            img.src = imageArray[index].url;
            img.id = 'image';
            div.appendChild(img);
        } 
    }

    loadRemainingImages(remainingImagesArray) {
        // Taking care of rest of images
        for( var i = 0; i < remainingImagesArray.length; i++ ) {
            // Store the image element
            var imageElement = remainingImagesArray[i];
            // Create a new DIV element which is a child of our container
            var div = this._elements.sliderWrap.appendChild(document.createElement('DIV'));
            // Create a new img element
            var imgNode = document.createElement('IMG');
            // Apply all necessary attributes to it
            imgNode.src = imageElement.url;
            imgNode.id = "image";
            // and finally append it as child node to the div
            div.appendChild(imgNode);
        }

        this.emit('allImagesLoaded', "");
    }


    initiateView() {
        // Add event listeners to buttons, etc.
        this._elements.prevBtn.addEventListener('click', () => this.emit('previousButtonClicked', ""));
        this._elements.nextBtn.addEventListener('click', () => this.emit('nextButtonClicked', ""));
        this.emit('viewInitiated', "");
    }

    /*
        Maybe transfering gallery to View object directly is not the best practise for MVC, because although JavaScript
        is pass-by-value for primitives, this is not true for Objects, where it uses call-by-sharing,
        where you could actually mutate properties of object and they would persist out of function.
        In this case, View should not be able to manipulate data of a Model.

        However, in my specific case, I am aware that I am NOT manipulating any data in View.

        Finally, I decided to respect MVC flow and View should not directly speak to Model, so I tunneled
        my request through Controller.
    */
    initiatePagination( numberOfImages, currentSlidePosition ) {
        var _this = this;
        // Initialize pagination
        for( var i = 0; i < numberOfImages; i++ ) {
            let spanNode = document.createElement('SPAN');

            // Add Click listener on each element dynamically
            // have to do it using IIFE, otherwise it will register it only on last index
            (function(index) {
                spanNode.onclick = function() {
                    // On click emit the event with index as argument
                    _this.emit('paginatedIndexClicked', index);
                }
            })(i);

            this._elements.paginationSelectors.appendChild(spanNode);
        }
        this.setActivePagination(currentSlidePosition);
    }

    setActivePagination(index) {
        // Resetting pagination first, so that there is none selected
        this.resetActivePagination();
        let paginationArray = [...this._elements.paginationSelectors.children]
        if( paginationArray.length > 0 )    paginationArray[index].className = "active";
    }
    
    resetActivePagination() {
        // Control pagination with settings class attribute
        let paginationArray = [...this._elements.paginationSelectors.children]
        paginationArray.forEach( current => current.className = "" );
    }
}