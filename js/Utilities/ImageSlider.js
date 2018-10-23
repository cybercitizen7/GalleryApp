export default function ImageSlider(options, fn) {
    'use strict'

    // Utilities
    // simple no operation function
    var noop = function() {};
    // offload a functions execution
    var offloadFn = function(fn) { setTimeout(fn || noop, 0); };

    // check browser capabilities for support of touch, transitions,..
    var browser = {
        addEventListener: !!window.addEventListener,
        touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions: (function(temp) {
            // define different transition properties depending on browser
            var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
            // loop through them and check with our dummy element if the propery is applied in its styles
            for ( var i in props ) if (temp.style[ props[i] ] !== undefined) return true;
            return false;
        })(document.createElement('slide'))
    };

    // Return if there is no root element
    if( !options.container ) return;
    // Get the Slider reference
    var slider = options.container.children[0];
    // initiate empty variables for future reference
    var slides, slidePos, width, length;

    // intiation options object
    options = options || {};

    // Speed is used for animation, how long it takes to slide to another slide
    var speed = 300;
    // This will be the starting index
    var index = parseInt(options.startIndex, 10) || 0;
    // Check for correct index, since we do not know how many images will be returned (minimum 2 is promised!)
    if( index >= slider.children.length ) index = 0;

    // Loop Panel means that it will go from begining once it reaches the end of slideshow
    options.loopPanel = options.loopPanel !== undefined ? options.loopPanel : true;

    // Throttle function is actually used uppon resizing window
    // it delays the execution of the input fn until user finishes
    // resizing the window. This should help out not to call setup()
    // for every step on resizing, but wait until user's done and then
    // call it just once
    var throttle = function (fn, threshhold) {
        threshhold = threshhold || 100;
        var timeout = null;

        function cancel() {
            if (timeout) clearTimeout(timeout);
        }

        function throttledFn() {
            var context = this;
            var args = arguments;
            cancel();
            timeout = setTimeout(function() {
                timeout = null;
                fn.apply(context, args);
            }, threshhold);
        }

        // allow remove throttled timeout
        throttledFn.cancel = cancel;

        return throttledFn;
    };

    // throttled setup
    var throttledSetup = throttle(setup);

    // Setting up initial variables
    var start = {};
    var delta = {};
    var isScrolling;

    // Currently hard coded, could be an OPTION to pass
    var stopPropagation = true;

    // In this JSON object we will store all the necessary event handlers and functions
    // which we will later pass on as input to addEventListener() as listener object
    var events = {
        // Handle event will forward to the right function, depending on the event.type
        handleEvent: function(event) {            
            switch( event.type ) {                
                case 'mousedown':
                case 'touchstart': this.start(event); break;
                case 'mousemove':
                case 'touchmove': this.move(event); break;
                case 'mouseup':
                case 'mouseleave':
                case 'touchend': this.end(event); break;
                case 'resize': throttledSetup(); break;
            }
            // if we do not want to propagate our event listeners to parent elements of images
            if( stopPropagation ) event.stopPropagation();
        },

        start: function(event) {
            var touches;
            var mouseEvent = isMouseEvent(event);
            
            // 
            if( mouseEvent ) {
                touches = event;
                // if we will not prevent the default behaviour at this point
                // we will keep registering click down event if we are dragging
                // so it will never actually release it as we want to, as we implement
                // our own move function
                event.preventDefault();
            } else {
                // on touch event, we have coordinates stored in .touches[0] property
                touches = event.touches[0];
            }

            // register initial coordinates and the time
            start = {
                x: touches.pageX,
                y: touches.pageY,

                time: +new Date()
            }

            // reset variable 
            isScrolling = undefined;

            // reset the delta (difference)
            delta = {};

            // Attach event listeners to our slider
            if( mouseEvent ) {
                slider.addEventListener('mousemove', this, false);
                slider.addEventListener('mouseup', this, false);
                slider.addEventListener('mouseleave', this, false);
            } else {
                slider.addEventListener('touchmove', this, false);
                slider.addEventListener('touchend', this, false);
            }
        },

        move: function(event) {
            var touches;

            if( isMouseEvent(event) ) {
                touches = event;
            } else {
                // We register events only if it is a swipe with 1 one touch 
                if( event.touches.length > 1 || event.scale && event.scale !== 1 ) return;                            
                // Store touch coordinates as user is moving around
                touches = event.touches[0];
            }

            // calculate the delta (difference between starting coordinates and current coordinates)
            delta = {
                x: touches.pageX - start.x,
                y: touches.pageY - start.y,
            };
            
            // Check if user is scrolling vertically instead
            if( typeof isScrolling === 'undefined') {
                isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
            }

            // If user is scrolling / swiping the slides
            if(!isScrolling) {

                // Prevent native scrolling
                event.preventDefault();

                // we don't add resistance at the end of the slideshow, because it continues all over again
                if (options.loopPanel) {
                    // move the previous slide
                    translate(circle(index-1), delta.x + slidePos[circle(index-1)], 0);
                    // move the current slide
                    translate(index, delta.x + slidePos[index], 0);
                    // move the next slide
                    translate(circle(index+1), delta.x + slidePos[circle(index+1)], 0);

                } else {
                    // while moving slides, we have to know when we are at the last or first slide, to prevent moving further
                    delta.x = 
                        delta.x / ( ( !index && delta.x > 0 ||      // if first slide and sliding left
                            index === slides.length - 1             // OR if last slide and sliding right
                            && delta.x < 0                          // AND if we are sliding at all
                            )? (Math.abs(delta.x) / width + 1 )     // then determine the resistance level 
                            : 1                                     // else no resistance
                            );

                    translate(index-1, delta.x + slidePos[index-1], 0);
                    translate(index, delta.x + slidePos[index], 0);
                    translate(index+1, delta.x + slidePos[index+1], 0);
                }
            }
        },

        end: function(event) {

            // Calculate the duration from START of touch until END (here)
            var duration = +new Date() - start.time;
            
            // Here we determine whether we reached our Treshold to swipe to next slide
            // I defined the treshold as following:
            // the duration of swipe movement must be less than 250ms
            // and user must drag atleast 20px or if user swiped atleast half the width of the image (if some image would be less than 20px wide)
            var threshold = Number(duration) < 250 && (Math.abs(delta.x) > 20 || Math.abs(delta.x) > width / 2);
            var isValidSlide = threshold;

            // Determine if slide attempts it past start and end
            // if we want to loop over, than we set this to false, since it is allowed to loop again
            var isPastBounds = options.loopPanel ?
                false :
                ( !index && delta.x > 0 ||                        // IF the first slide and slide new position is greater than 0
                index === slides.length - 1 && delta.x < 0);       // OR if it is the last slide and slide new position is less than 0;     
            
            var direction = Math.abs(delta.x) / delta.x;

            // if not scrolling vertically
            if( !isScrolling ) {

                // if everything is OK with our requirements
                if ( isValidSlide && !isPastBounds ) {
                    // check if we are moving forward
                    if ( direction < 0 ) {
        
                        if ( options.loopPanel ) { 
                            // we need to get the next in this direction in place
                            move(circle(index-1), -width, 0);
                            move(circle(index+2), width, 0);
        
                        } else {
                            move(index-1, -width, 0);
                        }
                        // move the slide to the user's view
                        move(index, slidePos[index]-width, speed);
                        // move the next slide
                        move(circle(index+1), slidePos[circle(index+1)]-width, speed);
                        // update the current index after movement ended
                        index = circle(index+1);
        
                    } else {
                        // Same thing for moving backwards
                        if ( options.loopPanel ) { 
                            // we need to get the next in this direction in place
                            move(circle(index+1), width, 0);
                            move(circle(index-2), -width, 0);
        
                        } else {
                            move(index+1, width, 0);
                        }
        
                        move(index, slidePos[index]+width, speed);
                        move(circle(index-1), slidePos[circle(index-1)]+width, speed);
                        index = circle(index-1);
                    }
                    // send callback notification after movement ended
                    runCallback(getPos(), slides[index], direction);
        
                } else {
                    // if the treshold was not met
                    // but looping is enabled
                    if ( options.loopPanel ) {
                        // Do a movement translation, but actually return back 
                        // to the existing index
                        move(circle(index-1), -width, speed);
                        move(index, 0, speed);
                        move(circle(index+1), width, speed);
        
                    } else {
                        // treshold could be met, but looping is not allowed 
                        // and we are past bounds (first or last slide)
                        // still.. do move the slides, but snap back
                        // to the current index
                        move(index-1, -width, speed);
                        move(index, 0, speed);
                        move(index+1, width, speed);
                    }
                }
            }

            // when event was finished, remove the listeners
            if( isMouseEvent(event) ) {
                slider.removeEventListener('mousemove', this, false);
                slider.removeEventListener('mouseup', this, false);
                slider.removeEventListener('mouseleave', this, false);
            } else {
                slider.removeEventListener('touchmove', event, false);
                slider.removeEventListener('touchend', event, false);
            }
        }
    }

    // Setup the slider
    setup();

    // Finally, exposing required API
    return {
        setup: function() {
            setup();
        },

        goToItem: function( indexTo ) {
            slide(indexTo, speed);
        },

        previousItem: function() {
            previousItem();
        },

        nextItem: function() {
            nextItem();
        },

        getPos: function() {
            return getPos();
        },

        getNumberOfSlides: function() {
            return length;
        }
    }

    function setup() {
        // cache slides
        slides = slider.children;
        length = slides.length;

        // If there is only 1 slide, looping does not make sense
        if( slides.length < 2 ) options.loopPanel = false;
  
        // slides length correction, minus cloned slides
        for (var i = 0; i < slides.length; i++) {
            if (slides[i].getAttribute('data-cloned')) length--;
        }
  
  
        // special case if two slides
        if (browser.transitions && options.loopPanel && slides.length < 3) {
            slider.appendChild(slides[0].cloneNode(true));
            slider.appendChild(slides[1].cloneNode(true));           

            slides = slider.children;
        }
  
        // create an array to store current positions of each slide
        slidePos = new Array(slides.length);
  
        // determine width of each slide
        // here we store the container's width
        var boundingRect = options.container.getBoundingClientRect();
        // I am adding .left to accomodate the margin from body
        width =  ( boundingRect.width + boundingRect.left ) || options.container.offsetWidth;

        // now we set the sliders width to accomodate all the slides inside of it
        // slider has overflow set to hidden, so it will anyway clip the layout to accomodate only 1 slide
        // even though its actual width is much wider than user can see 
        slider.style.width = (slides.length * width * 2) + 'px';
  
        // stack elements
        var pos = slides.length;
        while(pos--) {
            var slide = slides[pos];
            slide.style.width = width + 'px';
            slide.setAttribute('data-index', pos);

            if ( browser.transitions ) {
                // Setting the position of the current slide
                // e.g. if it is the last slide, it will be on most left side
                // and the first one will be positioned at the current user's view
                slide.style.left = (pos * -width) + 'px';
                // POS: Slide index position in array
                // DIST: Distance from the starting index ,
                // SPEED: Instant
                // Move will store the location of the current slide in slidePos
                move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
            }
        }

        // reposition elements before and after index in case of loop options
        // so we have next and previous slide ready
        if ( options.loopPanel && browser.transitions ) {
            move(circle(index-1), -width, 0);
            move(circle(index+1), width, 0);
        }

        // if browser does not suport transitions, we have to adjust the slider element itself
        // to position at the current starting index
        if ( !browser.transitions )   slider.style.left = (index * -width) + 'px';        
  
        // options.container.style.visibility = 'visible';

        // Reset event listeners
        detachEvents();
        attachEvents();
    }

    function nextItem() {
        // if we have auto loop enables OR if it is not the last slide
        // we can continue to slide
        if( options.loopPanel ||  index < slides.length - 1)    slide(index+1); 
    }

    function previousItem() {
        // if we have auto loop enables OR if it is not the first slide
        // we can go to previous slide
        if( options.loopPanel || index > 0 )    slide(index-1);
    }

    function circle(index) {

        // a simple positive modulo using slides.length
        // we have to use positive module for LOOP option, because
        // increment index + 1 could go out of bounds of an array,
        // however, positive modulo will return the first element in that case
        // and in index - 1, if result would be -1, it returns the last slide
        // which means we create a nice way to easily loop slides
        return (slides.length + (index % slides.length)) % slides.length;
    }

    function slide(toIndex, slideSpeed) {
        // do nothing if already on requested slide
        if (index === toIndex) return;
        // if to index is not a valid input, just return
        // if( typeof toIndex !== 'number' || toIndex > slides.length || toIndex === -1 ) return;

        // If browser supports transitions we can use our move() function
        // to translate to the toIndex slide
        if (browser.transitions) {

            // Simple maths to calculate direction of movement => 1: backward, -1: forward
            var direction = Math.abs(index-toIndex) / (index-toIndex); 

            // get the actual position of the slide
            if ( options.loopPanel ) {
                var natural_direction = direction;
                // slidePos[index] will return the position of the Slide we want to go to
                // so dividing it by width, we will get a whole number like -1, 1
                // because slidePos basically holds information whether the slide we want to go to
                // is in front or behind the current slide (+ or - width)
                direction = -slidePos[circle(toIndex)] / width;
    
                // if going forward but toIndex < index, use toIndex = slides.length + toIndex
                // if going backward but toIndex > index, use toIndex = -slides.length + toIndex
                if (direction !== natural_direction)    toIndex = -direction * slides.length + toIndex;
            }
            
            // Difference between current index and where we want to slide to 
            // if we are on index 0 and want to go to index 2
            // the difference will be 1          
            var diff = Math.abs(index-toIndex) - 1;
    
            // move all the slides between index and toIndex in the right direction
            while (diff--) {                
                move( circle((toIndex > index ? toIndex : index) - diff - 1), width * direction, 0);
            }
            
            toIndex = circle(toIndex);
            // Also move the current slide in respectful direction, because above while loop
            // ends before reaching the current index, it just moves slides that are BETWEEN them,
            // not inclusive!
            move(index, width * direction, slideSpeed || speed);
            // Finally move the slide we want to see to the user's view ( dist = 0 )
            move(toIndex, 0, slideSpeed || speed);
            
            // we need to get the next in place
            if (options.loopPanel)  move(circle(toIndex - direction), -(width * direction), 0);            
  
        } else {
            toIndex = circle(toIndex);
            animate(index * -width, toIndex * -width, slideSpeed || speed);
            // no fallback for a circular continous if the browser does not accept transitions
        }

        // Update the current index for future reference
        index = toIndex;
        // Notify callback function that a move was made
        offloadFn(function() {
          runCallback(getPos(), slides[index], direction);
        });
    }

    function move(index, dist, speed) {
        translate(index, dist, speed);
        slidePos[index] = dist;
    }

    function translate(index, dist, speed) {
        // Lets save the current slide  
        var slide = slides[index];
        // then retrieve it's style
        var style = slide && slide.style;
  
        if (!style) return;
        // Now lets set animation duration, supporting different browsers
        style.webkitTransitionDuration =
          style.MozTransitionDuration =
          style.msTransitionDuration =
          style.OTransitionDuration =
          style.transitionDuration = speed + 'ms';
        // now lets actually execute the translate function to position the slide
        // in corresponding X coordinate positions. We do not move slides in Y or Z.
        style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
        style.msTransform =
          style.MozTransform =
          style.OTransform = 'translateX(' + dist + 'px)';
  
    }

    function animate(from, to, speed) {
        // Animate function is called when we detect that browser
        // is not supporting transitions

        // if not an animation, just reposition
        if (!speed) {
          slider.style.left = to + 'px';
          return;
        }
        
        // store the start of animation
        var start = +new Date();
        
        // Execute interval timer every 4ms
        var timer = setInterval(function() {
            // messure how much time elapsed since start of animation
            var timeElap = +new Date() - start;

            // if time has elapsed
            if (timeElap > speed) {
                // position the slider to the current index
                slider.style.left = to + 'px';
                // finish interval
                clearInterval(timer);
                return;
            }

            // move the slider with the defined speed towards our final index, with a step function 
            // this emulates animation behaviour, rendering every 4ms to set new left position of slider
            // until animation time (speed) is matched and we are showing the actual slide we wanted to show
            slider.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';
        }, 4);
  
    }

    function getPos() {
        // return index;
        // Fix for the clone issue in the event of 2 slides
        var currentIndex = index;

        if (currentIndex >= length) {
            currentIndex = currentIndex - length;
        }

        return currentIndex;
    }

    function runCallback(pos, index, dir) {
        // fn is a function that was passed to ImageSlider and is used as
        // callback function to notify GalleryModel about changes to Slider
        fn(pos, index, dir);
    }

    function isMouseEvent(e) {
        if( 'object' === typeof e ) {
            if( e.button >= 0 && e.button < 3 ) {
                return true;
            }
        }
        return false;
    }

    function attachEvents() {
        if (browser.addEventListener) {
    
            // set touchstart event on element
            if (browser.touch) {
                slider.addEventListener('touchstart', events, false);
            } 
            // We assign mousedown listener even if browser supports touch
            // this supports PC browsers which have capability also of touch        
            slider.addEventListener('mousedown', events, false);

            window.addEventListener('resize', events, false);
    
        } else {
            // Making sure it works on older IE
            window.onresize = throttledSetup; // function() { setup() };
        }
    }

    function detachEvents() {
        if (browser.addEventListener) {
            // remove current event listeners
            slider.removeEventListener('touchstart', events, false);
            slider.removeEventListener('mousedown', events, false);
            window.removeEventListener('resize', events, false);
        } 
    }
};









