;(function ($, window, document, undefined) {
    'use strict';

    $.fn.imageLightboxExtended = function (options, plugins) {
        var options = options || {},
            plugins = plugins || ['overlay', 'closeButton', 'arrows', 'activityIndicator'],
            extensions = {
                quitOnDocClick: plugins.indexOf('closeButton') == -1,
                onStart: function () {
                    if (plugins.indexOf('overlay') != -1) overlayOn();
                    if (plugins.indexOf('closeButton') != -1) closeButtonOn(lightbox);
                    if (plugins.indexOf('arrows') != -1) arrowsOn(lightbox, selector);
                    if (plugins.indexOf('navigation') != -1) navigationOn(lightbox, selector);

                    if (typeof options.onStart != 'undefined') options.onStart();
                },
                onEnd: function () {
                    if (plugins.indexOf('overlay') != -1)  overlayOff();
                    if (plugins.indexOf('caption') != -1) captionOff();
                    if (plugins.indexOf('closeButton') != -1) closeButtonOff();
                    if (plugins.indexOf('arrows') != -1) arrowsOff();
                    if (plugins.indexOf('navigation') != -1) navigationOff();
                    if (plugins.indexOf('activityIndicator') != -1) activityIndicatorOff();

                    if (typeof options.onEnd != 'undefined') options.onEnd();
                },
                onLoadStart: function () {
                    if (plugins.indexOf('caption') != -1) captionOff();
                    if (plugins.indexOf('activityIndicator') != -1) activityIndicatorOn();

                    if (typeof options.onLoadStart != 'undefined') options.onLoadStart();
                },
                onLoadEnd: function () {
                    if (plugins.indexOf('caption') != -1) captionOn();
                    if (plugins.indexOf('navigation') != -1) navigationUpdate(selector);
                    if (plugins.indexOf('activityIndicator') != -1) activityIndicatorOff();
                    if (plugins.indexOf('arrows') != -1) $('.imagelightbox-arrow').css({'display': 'block'});

                    if (typeof options.onLoadEnd != 'undefined') options.onLoadEnd();
                }
            };

        var selector = this.selector,
            lightbox = $(selector).imageLightbox($.extend({}, options, extensions));

        return lightbox;
    };


    /* ACTIVITY INDICATION */

    function activityIndicatorOn() {
        $('<div id="imagelightbox-loading"><div></div></div>').appendTo('body');
    }
    function activityIndicatorOff() {
        $('#imagelightbox-loading').remove();
    }


    /* OVERLAY */

    function overlayOn() {
        $('<div id="imagelightbox-overlay"></div>').appendTo('body');
    }
    function overlayOff() {
        $('#imagelightbox-overlay').remove();
    }


    /* "CLOSE" BUTTON */

    function closeButtonOn(instance) {
        $('<button type="button" id="imagelightbox-close" title="Close"></button>')
            .appendTo('body')
            .on('click touchend', function () {
                $(this).remove();
                instance.quitImageLightbox();
                return false;
            });
    }
    function closeButtonOff() {
        $('#imagelightbox-close').remove();
    }


    /* CAPTION */

    // TODO can't work with zoom
    function captionOn() {
        var description = $('a[href="' + $('#imagelightbox').attr('src') + '"] img').attr('alt');
        if(description.length > 0) {
            $('<div id="imagelightbox-caption">' + description + '</div>').appendTo('body');
        }
    }
    function captionOff() {
        $('#imagelightbox-caption').remove();
    }


    /* NAVIGATION */

    // TODO untested
    function navigationOn(instance, selector) {
        var images = $(selector);
        if(images.length)
        {
            var nav = $('<div id="imagelightbox-nav"></div>');
            for(var i = 0; i < images.length; i++)
                nav.append('<button type="button"></button>');

            nav.appendTo('body');
            nav.on('click touchend', function (){return false;});

            var navItems = nav.find('button');
            navItems.on('click touchend', function ()
            {
                var $this = $(this);
                if(images.eq($this.index()).attr('href') != $('#imagelightbox').attr('src'))
                    instance.switchImageLightbox($this.index());

                navItems.removeClass('active');
                navItems.eq($this.index()).addClass('active');

                return false;
            })
            .on('touchend', function (){return false;});
        }
    }
    function navigationUpdate(selector) {
        var items = $('#imagelightbox-nav button');
        items.removeClass('active');
        items.eq($(selector).filter('[href="' + $('#imagelightbox').attr('src') + '"]').index(selector)).addClass('active');
    }
    function navigationOff() {
        $('#imagelightbox-nav').remove();
    }


    /* ARROWS */

    function arrowsOn(instance, selector) {
        if ($(selector).length < 2) {
            return;
        }

        var $arrows = $(
            '<button type="button" class="imagelightbox-arrow imagelightbox-arrow-left"></button>' +
            '<button type="button" class="imagelightbox-arrow imagelightbox-arrow-right"></button>'
        );

        $arrows.appendTo('body');

        $arrows.on('click touchend', function (e) {
            e.preventDefault();

            var $this = $(this),
                index = $('#imagelightbox').data('index');

            if ($this.hasClass('imagelightbox-arrow-left')) {
                index = index - 1;
                if (!$(selector).eq(index).length) {
                    index = $(selector).length;
                }
            } else {
                index = index + 1;
                if (!$(selector).eq(index).length) {
                    index = 0;
                }
            }

            instance.switchImageLightbox(index);
            return false;
        });
    }
    function arrowsOff() {
        $('.imagelightbox-arrow').remove();
    }

})(jQuery, window, document);
