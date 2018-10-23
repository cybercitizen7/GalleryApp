/*
    Event Emitter is used as parent class to our MVC classes.
    The purpose is to enable emitting events, so that MVC can 
    communicate whether to update something in respectful class
    after certain event was finished / fired.
*/
export default class EventEmitter {
    constructor() {
        this._events = {};
    }

    // Registering listeners to specific events 
    on(event, listener) {
        (this._events[event] || (this._events[event] = [])).push(listener);
        return this;
    }

    // Emit the event, so that all reigstered listeners will be notified (callback)
    emit(event, args) {
        (this._events[event] || []).slice().forEach(listener => listener(args));
    }
}