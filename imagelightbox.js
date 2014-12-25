
/*
    By Osvaldas Valutis, www.osvaldas.info
    Available for use under the MIT License
*/

;(function ($, window, document, undefined)
{
    'use strict';

    var cssTransitionSupport = function ()
        {
            var s = document.body || document.documentElement, s = s.style;
            if (s.WebkitTransition == '') return '-webkit-';
            if (s.MozTransition == '') return '-moz-';
            if (s.OTransition == '') return '-o-';
            if (s.transition == '') return '';
            return false;
        },

        isCssTransitionSupport = cssTransitionSupport() === false ? false : true,

        cssTransitionTranslateX = function (element, positionX, speed)
        {
            var options = {}, prefix = cssTransitionSupport();
            options[prefix + 'transform']  = 'translateX(' + positionX + ')';
            options[prefix + 'transition'] = prefix + 'transform ' + speed + 's linear';
            element.css(options);
        },

        hasTouch    = ('ontouchstart' in window),
        hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
        wasTouched  = function (event)
        {
            if (hasTouch)
                return true;

            if (!hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined')
                return false;

            if (typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined')
            {
                if (event.MSPOINTER_TYPE_MOUSE != event.pointerType)
                    return true;
            }
            else
                if (event.pointerType != 'mouse')
                    return true;

            return false;
        };

    $.fn.imageLightbox = function (options)
    {
        var options = $.extend({
                dynamicalTargets: false,  // recollect targets before open lightbox
                allowedTypes: 'png|jpg|jpeg|gif',
                groupByClosest: false,  // '.class' - selector to grouping elements
                                        // into separate slideshow by elements'
                                        // parent or by elements themself;
                                        // selected element must have data-lightbox-group
                                        // attribute with slideshow number or another divider
                zoomScale: [],  // [2, 3] - HiDPI alternatives list, alternative has
                                // same address with special suffix, @2x.png for example
                animationSpeed: 250,
                preloadNext: 1,  // silently preload the next _ images
                enableKeyboard: true,  // enable keyboard shortcuts (arrows Left/Right and Esc)
                quitOnEnd: false,  // quit after viewing the last image
                quitOnImgClick: false,  // quit when the viewed image is clicked
                quitOnDocClick: true,  // quit when anything but the viewed image is clicked
                onStart: false,  // calls function when the lightbox starts
                onEnd: false,  // calls function when the lightbox quits
                onLoadStart: false,  // calls function when the image load begins
                onLoadEnd: false  // calls function when the image finishes loading
            }, options),

            targetSelector = '',
            allTargets  = {},
            targets     = $([]),
            target      = $(),
            image       = $(),
            imageWidth  = 0,
            imageHeight = 0,
            swipeDiff   = 0,
            inProgress  = false,
            zoom        = 1,

            isTargetValid = function (element) {
                return $(element).prop('tagName').toLowerCase() == 'a' && (new RegExp('\.(' + options.allowedTypes + ')$', 'i')).test($(element).attr('href'));
            },

            getGroupName = function (el) {
                var $el = $(el),
                    group = 'default';
                if ($el.length && options.groupByClosest) {
                    return $el.closest(options.groupByClosest).data('lightbox-group') || group;
                } else {
                    return group;
                }
            },

            collectTargets = function () {
                $(targetSelector).each(function () {
                    if (!isTargetValid(this)) return true;
                    var $target = $(this);
                    var group = getGroupName($target);
                    allTargets[group] = allTargets[group] || $([]);
                    allTargets[group] = allTargets[group].add($target);
                });
            },

            // firstTarget will be .first() of default group if undefined
            start = function (firstTarget) {
                if (inProgress) return false;
                inProgress = false;
                if (options.dynamicalTargets) collectTargets();
                var $firstTarget = $(firstTarget);
                targets = $(allTargets[getGroupName($firstTarget)]);
                if (!targets.length) {
                    console.log('no such targets');
                    return false;
                }
                if (options.onStart !== false) options.onStart();
                target = $firstTarget.length ? $firstTarget : targets.first();
                loadImage();
            },

            getZoom = function () {
                for (var i = options.zoomScale.length - 1; i >= 0; i--) {
                    if (window.devicePixelRatio >= options.zoomScale[i]) {
                        return options.zoomScale[i];
                    }
                }
                return 1;
            },

            getImageSrc = function (target) {
                var src = target.attr('href');
                if (zoom == 1) {
                    return src;
                }
                var suffix = '.' + src.split('.').slice(-1)[0];
                return src.replace(suffix, '@' + zoom + 'x' + suffix);
            },

            setImage = function ()
            {
                if (!image.length) return true;

                var screenWidth  = $(window).width() * 0.8,
                    screenHeight = $(window).height() * 0.9,
                    tmpImage     = new Image();

                tmpImage.src    = image.attr('src');
                tmpImage.onload = function ()
                {
                    imageWidth   = tmpImage.width / zoom;
                    imageHeight  = tmpImage.height / zoom;

                    if (imageWidth > screenWidth || imageHeight > screenHeight)
                    {
                        var ratio    = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
                        imageWidth  /= ratio;
                        imageHeight /= ratio;
                    }

                    image.css(
                    {
                        'width':  imageWidth + 'px',
                        'height': imageHeight + 'px',
                        'top':    ($(window).height() - imageHeight) / 2 + 'px',
                        'left':   ($(window).width() - imageWidth) / 2 + 'px'
                    });

                    image.show();
                };
            },

            loadImage = function (direction)
            {
                if (inProgress) return false;

                var directionLoad = 1,
                    directionAnimation = false;
                if (typeof direction != 'undefined') {
                    if (direction == 'left') {
                        directionLoad = -1;
                        directionAnimation = 1;
                    } else {
                        directionAnimation = -1;
                    }
                }

                var targetIndex = targets.index(target);

                if (image.length)
                {
                    if (directionAnimation !== false && (targets.length < 2 || (options.quitOnEnd === true && ((directionAnimation === -1 && targetIndex == 0) || (directionAnimation === 1 && targetIndex == targets.length - 1)))))
                    {
                        quitLightbox();
                        return false;
                    }
                    var params = {'opacity': 0};
                    if (isCssTransitionSupport) cssTransitionTranslateX(image, (100 * directionAnimation) - swipeDiff + 'px', options.animationSpeed / 1000);
                    else params.left = parseInt(image.css('left')) + 100 * directionAnimation + 'px';
                    image.animate(params, options.animationSpeed, function (){removeImage();});
                    swipeDiff = 0;
                }

                inProgress = true;
                if (options.onLoadStart !== false) options.onLoadStart();

                setTimeout(function () {
                    zoom = getZoom();

                    image = $('<img id="imagelightbox" style="display: none" />')
                    .attr('src', getImageSrc(target))
                    .load(function () {
                        image.appendTo('body');
                        setImage();

                        var params = {'opacity': 1};

                        image.css('opacity', 0);
                        if (isCssTransitionSupport) {
                            cssTransitionTranslateX(image, -100 * directionAnimation + 'px', 0);
                            setTimeout(function (){cssTransitionTranslateX(image, 0 + 'px', options.animationSpeed / 1000)}, 50);
                        }
                        else {
                            var imagePosLeft = parseInt(image.css('left'));
                            params.left = imagePosLeft + 'px';
                            image.css('left', imagePosLeft - 100 * directionAnimation + 'px');
                        }

                        image.animate(params, options.animationSpeed, function () {
                            inProgress = false;
                            if (options.onLoadEnd !== false) options.onLoadEnd();
                        });
                        if (options.preloadNext > 0) {
                            for (var i = 1; i <= options.preloadNext; i++) {
                                var nextTargetIndex = targetIndex + i * directionLoad;
                                if (nextTargetIndex > targets.length - 1) {
                                    nextTargetIndex = nextTargetIndex - targets.length;
                                } else if (nextTargetIndex < 0) {
                                    nextTargetIndex = nextTargetIndex + targets.length;
                                }
                                var nextTarget = targets.eq(nextTargetIndex);
                                $('<img />').attr('src', getImageSrc(nextTarget)).load();
                            }
                        }
                    })
                    .error(function () {
                        if (options.onLoadEnd !== false) options.onLoadEnd();
                    });

                    var swipeStart   = 0,
                        swipeEnd     = 0,
                        imagePosLeft = 0;

                    image.on(hasPointers ? 'pointerup MSPointerUp' : 'click', function (e) {
                        e.preventDefault();
                        if (options.quitOnImgClick)
                        {
                            quitLightbox();
                            return false;
                        }
                        if (wasTouched(e.originalEvent)) return true;
                        var posX = (e.pageX || e.originalEvent.pageX) - e.target.offsetLeft;
                        switchImage(imageWidth / 2 > posX ? 'left' : 'right');
                    })
                    .on('touchstart pointerdown MSPointerDown', function (e) {
                        if (!wasTouched(e.originalEvent) || options.quitOnImgClick) return true;
                        if (isCssTransitionSupport) imagePosLeft = parseInt(image.css('left'));
                        swipeStart = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
                    })
                    .on('touchmove pointermove MSPointerMove', function (e) {
                        if (!wasTouched(e.originalEvent) || options.quitOnImgClick) return true;
                        e.preventDefault();
                        swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[0].pageX;
                        swipeDiff = swipeStart - swipeEnd;
                        if (isCssTransitionSupport) cssTransitionTranslateX(image, -swipeDiff + 'px', 0);
                        else image.css('left', imagePosLeft - swipeDiff + 'px');
                    })
                    .on('touchend touchcancel pointerup pointercancel MSPointerUp MSPointerCancel', function (e) {
                        if (!wasTouched(e.originalEvent) || options.quitOnImgClick) return true;
                        if (Math.abs(swipeDiff) > 50) {
                            switchImage(swipeDiff > 0 ? 'right' : 'left');
                        }
                        else {
                            if (isCssTransitionSupport) cssTransitionTranslateX(image, 0 + 'px', options.animationSpeed / 1000);
                            else image.animate({'left': imagePosLeft + 'px'}, options.animationSpeed / 2);
                        }
                    });

                }, options.animationSpeed + 100);
            },

            switchImage = function (indexOrDirection) {
                if (inProgress) {
                    return false;
                }
                if (indexOrDirection < -1 || indexOrDirection > targets.length) {
                    console.log('index is out of range');
                    return false;
                }
                var indexNew = indexOrDirection,
                    indexCurrent = targets.index(target);
                if (indexOrDirection == 'left') {
                    indexNew = indexCurrent - 1;
                } else if (indexOrDirection == 'right') {
                    indexNew = indexCurrent + 1;
                }
                if (indexNew == -1) {
                    target = targets.eq(targets.length - 1)
                } else if (indexNew == targets.length) {
                    target = targets.eq(0)
                } else {
                    target = targets.eq(indexNew)
                }
                loadImage(indexNew < indexCurrent ? 'left' : 'right');
            },

            removeImage = function ()
            {
                if (!image.length) return false;
                image.remove();
                image = $();
            },

            quitLightbox = function ()
            {
                if (!image.length) return false;
                image.animate({'opacity': 0}, options.animationSpeed, function ()
                {
                    removeImage();
                    inProgress = false;
                    if (options.onEnd !== false) options.onEnd();
                });
            };

        $(window).on('resize', setImage);

        if (options.quitOnDocClick)
        {
            $(document).on(hasTouch ? 'touchend' : 'click', function (e)
            {
                if (image.length && !$(e.target).is(image)) quitLightbox();
            })
        }

        if (options.enableKeyboard)
        {
            $(document).on('keyup', function (e)
            {
                if (!image.length) return true;
                e.preventDefault();
                if (e.keyCode == 27) quitLightbox();
                if (e.keyCode == 37 || e.keyCode == 39)
                {
                    target = targets.eq(targets.index(target) - (e.keyCode == 37 ? 1 : -1));
                    if (!target.length) target = targets.eq(e.keyCode == 37 ? targets.length : 0);
                    loadImage(e.keyCode == 37 ? 'left' : 'right');
                }
            });
        }

        targetSelector = this.selector;

        $(document).on('click', targetSelector, function (e) {
            if (!isTargetValid(this)) return true;
            e.preventDefault();
            start(this);
        });

        collectTargets();

        this.start = start;
        this.collectTargets = collectTargets;
        this.switchImageLightbox = switchImage;

        this.targetsLength = function () {
            return targets.length;
        };

        this.quitImageLightbox = function () {
            quitLightbox();
            return this;
        };

        return this;
    };
})(jQuery, window, document);
