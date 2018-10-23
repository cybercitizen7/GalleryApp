import ImageSlider from "../Utilities/ImageSlider.js";
import EventEmitter from "../Utilities/EventEmitter.js";

export default class GalleryModel extends EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }

    fetchImages() {
        // Using XMLHTTPRequest to talk with PHP
        var xmlhttp = new XMLHttpRequest();
        var _this = this;
        // Callback function which will notify me once PHP gets its respond
        xmlhttp.onreadystatechange = function() {
            if( this.readyState == 4 && this.status == 200) {
                // JSON response received
                var jsonResponse = JSON.parse(this.response);
                // Emit the event that we received images
                _this.emit('imagesFetched', [ jsonResponse, _this.options.startIndex ]);
            }
        }
        // Perhaps could be done better than sending as query parameter the URL - open to advice
        xmlhttp.open("GET", "index.php?q=" + this.options.api, true);
        xmlhttp.send();
    }

    nextItem() {
        if( this.gallery ) {
            this.gallery.nextItem();
            this.emit('buttonClicked', this.gallery.getPos());
        }        
    }
    previousItem() {
        if( this.gallery ) {
            this.gallery.previousItem();
            this.emit('buttonClicked', this.gallery.getPos());
        }
    }

    goToItem( indexTo ) {
        if( this.gallery ) {
            this.gallery.goToItem(indexTo);
            this.emit('pageClicked', indexTo);
        }
    }

    getCurrentIndex() {
        if( this.gallery ) {
            return this.gallery.getPos();
        } 
        return 0;
    }

    getNumberOfSlides() {
        if( this.gallery ) {
            return this.gallery.getNumberOfSlides();
        }
        return 0;
    }

    initializeGallery() {
        var _this = this;
        // Passing also the callback function, so that I know when there is a Touch Event
        // that changed the slide for pagination
        this.gallery = new ImageSlider(this.options, function( index, element, direction ) {
            _this.emit("callbackTriggered", index);
        });

        this.emit('galleryInitiated', "");
    }
}