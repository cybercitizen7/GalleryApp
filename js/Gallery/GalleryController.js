import EventEmitter from "../Utilities/EventEmitter.js";

export default class GalleryController extends EventEmitter {
    constructor(model, view) {
        super();
        this._model = model;
        this._view = view;

        /* 
            Register listeners for event
            In my case the Controller is a bit 'dumb', because it does not do any
            real manipulation on data, it just forwards the events to Model, as I still
            want to follow the one-way communication rule where View cannot directly talk with
            model, but model can talk with view - could also adapt that to go through controller
            to completed decouple all classes.
        */
        view.on('allImagesLoaded', () => this.initiateGallery());
        view.on('previousButtonClicked', () => this.previousItem());
        view.on('nextButtonClicked', () => this.nextItem());
        view.on('paginatedIndexClicked', index => this.goToItem(index));
        view.on('touchFinished', () => this.updatePaginationIndex());
        view.on('viewInitiated', () => this.initiatePagination());
        model.on('callbackTriggered', index => this.updateActivePagination(index));
        model.on('buttonClicked', index => this.updateActivePagination(index));
        model.on('pageClicked', index => this.updateActivePagination(index));
        model.on('imagesFetched', jsonResponse => this.onImagesFetched(jsonResponse));
        model.on('galleryInitiated', () => this.onGalleryInitiated());
    }

    onGalleryInitiated() {
        this._view.initiateView();
    }

    onImagesFetched(jsonResponse) {
        var imageArray = jsonResponse[0];
        var startIndex = jsonResponse[1];
        this._view.preloadImage(imageArray, startIndex);
    }

    initiateGallery() {
        this._model.initializeGallery();
    }

    initiatePagination() {
        this._view.initiatePagination(this.getNumberOfSlides(), this.getCurrentSlidePosition());
    }

    updateActivePagination(index) {
        this._view.setActivePagination(index);
    }
    
    previousItem() {
        this._model.previousItem();
    }

    nextItem() {
        this._model.nextItem();
    }

    goToItem(index) {
        this._model.goToItem(index);
    }

    getNumberOfSlides() {
        return this._model.getNumberOfSlides();
    }

    getCurrentSlidePosition() {
        return this._model.getCurrentIndex();
    }
}