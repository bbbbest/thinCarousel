(function (scope) {
    // check runtime environment
    (function () {
        if (!scope.document) throw new Error("runtime environment doesn't support Carousel.");
    }());

    // version: v0.0.1

    // inline document
    var doc = scope.document;

    // default listen to bubble event and stop propagate to other node.
    var addListener = (function () {
            var _handler = function (event, elem) {
            };
            return function (elem, en, handler) {
                handler = handler || _handler;
                if (en.match(/on\w*/)) {
                    en = en.replace('on', '')
                }
                elem.addEventListener(en, function (event) {
                    event.stopPropagation();
                    handler(event, elem);
                }, false);
            }
        }()),
        hover = function (elem, over, out) {
            addListener(elem, 'onmouseover', over);
            addListener(elem, 'onmouseout', out);
        },
        click = function (elem, handler) {
            addListener(elem, 'onclick', handler);
        };


    var isValidStr = function (str) {
            return typeof str === 'string' && str !== '';
        },
        isArray = function (arr) {
            return Object.prototype.toString.call(arr) === '[object Array]';
        },
        isNumber = function (num) {
            return Object.prototype.toString.call(num) === '[object Number]';
        },
        isObject = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Object]';
        },
        requireString = function (str) {
            if (!isValidStr(str)) {
                throw new Error(str + ' is not a valid string');
            }
        },
        requireArray = function (arr) {
            if (!isArray(arr)) {
                throw new Error(arr + ' is not a array');
            }
        },
        getElem = function (str) {
            return doc.createElement(str);
        },
        getCamelCase = (function () {
            var re = /-(\w)/g;
            return function (str) {
                return str.replace(re, function ($0, $1) {
                    return $1.toUpperCase()
                });
            }
        }());

    // source model
    var essentialProperties = ['url', 'desc', 'to'];

    /**
     * usual HTML methods
     */
    (function () {
        HTMLElement.prototype.caCss = function (key, value) {
            this.style[getCamelCase(key)] = value;
            return this;
        };

        HTMLElement.prototype.addClass = function (cls) {
            this.className = this.className ? this.className + ' ' + cls : cls;
            return this;
        };

        HTMLElement.prototype.removeClass = (function () {
            var r = /\s+/g;
            return function (cls) {
                this.className = this.className.replace(cls, '').trim().replace(r, ' ');
                return this;
            }
        }())
    }());

    function Carousel (selector) {
        requireString(selector);
        // container's id and element instance
        var id = selector;

        // timestamp is a unique flag of Carousel instance.
        var timestamp = String(Date.now()),
            // Carousel's container
            containerClass = 'ca_container_' + timestamp,
            imagesClass = 'ca_images_' + timestamp,
            coverClass = 'ca_cover_' + timestamp,
            buttonClass = 'ca_btn_' + timestamp,
            indicatorClass = 'ca_indicator_' + timestamp;

        // default properties
        var
            /**
             * container's width
             * @type {number}
             */
            $width = scope.innerWidth > 0 ?
                scope.innerWidth : doc.documentElement.clientWidth,

            /**
             * container's height
             * @type {number}
             */
            $height = scope.innerHeight > 0 ?
                scope.innerHeight : doc.documentElement.clientHeight,

            /**
             * carousel's picture source, such as ['url',...] or [{url: '', desc: '', to: ''}]
             * url is the image's source path
             * desc is the description of this image
             * to is the url point to the page on user click the image
             * @type {Array}
             */
            $source = [], cii, sl,
            /**
             * carousel is object model or single url model.
             * @type {boolean}
             */
            $objModel = false,

            /**
             * the animation duration
             * @type {number}
             */
            $duration = 3, $speed = 1,

            /**
             * percent model, it means the width unit is 'px' or '%'
             * @type {boolean}
             */
            $percent = false;

        // real carousel object
        var ca = {};

        // public method
        var w = function (w) {
                $width = w;
                return this;
            },
            h = function (h) {
                $height = h;
                return this;
            },
            p = function (p) {
                $percent = p;
                return this;
            },
            d = function (d) {
                $duration = d;
                return this;
            },
            s = function (sp) {
                $speed = sp;
                return this;
            },
            i = function (imgs) {
                requireArray(imgs);
                if (imgs.length === 0) {
                    throw new Error('images must not be empty.');
                }
                if (isObject(imgs[0])) {
                    var keys = Object.keys(imgs[0]);
                    for (var p in essentialProperties) {
                        if (typeof imgs[0][essentialProperties[p]] === 'undefined') {
                            throw new Error('essential properties is missed.');
                        }
                    }
                    $objModel = true;
                } else {
                    if (!isValidStr(imgs[0])) throw new Error("image's url is invalid.");
                    $objModel = false;
                }
                $source = imgs;
                cii = 0;
                sl = $source.length - 1;
                return this;
            };

        var currentIndicator, clicked = false;

        var
            /**
             * init container
             */
            initContainer = function () {
                var tg = doc.getElementById(id);
                if (!tg) throw new Error('not found this container which id is ' + id);
                tg.addClass(containerClass);
                ca.container = tg;
                tg.caCss('position', 'relative')
                    .caCss('width', String($width) + 'px')
                    .caCss('height', String($height) + 'px')
                    .caCss('overflow', 'hidden');
            },
            /**
             * init carousel with single url
             */
            initSimpleCarousel = function () {
                var ul = getElem('ul');
                ul.addClass(imagesClass);
                ca.images = ul;
                ul.caCss('list-style', 'none')
                    .caCss('width', String($width * $source.length) + 'px')
                    .caCss('height', String($height) + 'px')
                    .caCss('margin', '0')
                    .caCss('padding', '0')
                    .caCss('position', 'absolute')
                    .caCss('left', '0')
                    .caCss('transition', 'left ' + $speed + 's ease-in-out');

                $source.forEach(function (value) {
                    var li = getElem('li');
                    li.caCss('float', 'left')
                        .caCss('width', String($width) + 'px')
                        .caCss('height', String($height) + 'px');
                    li.innerHTML = '<img height="' + $height + '" src="' + value + '" alt="">';
                    ul.appendChild(li);
                });
            },
            initImages = function () {
                if (typeof $objModel === 'undefined') throw new Error('images are not transmitted.');
                if ($objModel) {
                    // TODO
                    console.log('no obj model.');
                } else {
                    initSimpleCarousel();
                }
            },
            initDuration = function () {
                ca.images.caCss('transition', 'left ' + $speed + 's ease-in-out');
            },
            renderActiveIndicator = function (indicator) {
                indicator.caCss('background-color', 'hotpink');
            },
            getCurrentIndicator = function (index) {
                return ca.indicators.children[index];
            },
            resetIndicator = function (indicator) {
                indicator.caCss('background-color', 'rgba(0,0,0,0.8)');
            },
            jumpTo = function (index) {
                resetIndicator(currentIndicator);
                currentIndicator = getCurrentIndicator(index);
                renderActiveIndicator(currentIndicator);
                ca.images.caCss('left', '-' + String(index * $width) + 'px');
            },
            prev = function () {
                // var ul = ca.images;
                cii = --cii < 0 ? sl : cii;
                jumpTo(cii);

            },
            next = function () {
                // var ul = ca.images;
                cii = ++cii > sl ? 0 : cii;
                jumpTo(cii);
            },
            initCover = function () {
                var co = getElem('div');
                co.addClass(coverClass);
                ca.cover = co;
                co.caCss('position', 'absolute')
                    .caCss('width', String($width) + 'px')
                    .caCss('height', String($height) + 'px');

                function initBtn (btn, fontSize, content, over, out) {
                    btn.caCss('display', 'flex')
                        .caCss('justify-content', 'center')
                        .caCss('align-items', 'center')
                        .caCss('font-family', '"Agency FB", serif')
                        .caCss('font-weight', 'bolder')
                        .caCss('font-size', String(fontSize) + 'em')
                        .caCss('color', 'rgba(255,255,255,0.8)')
                        .caCss('background-color', 'rgba(0, 0, 0, 0.1)')
                        .caCss('width', '10%')
                        .caCss('height', '25%')
                        .caCss('position', 'relative')
                        .caCss('cursor', 'pointer')
                        .caCss('top', '35%');
                    btn.innerText = content;
                    hover(btn, over, out)
                }

                function over (event) {
                    event.target.caCss('background-color', 'rgba(0, 0, 0, 0.3)')
                        .caCss('color', 'rgba(255,255,255, 0.9)')
                }

                function out (event) {
                    event.target.caCss('background-color', 'rgba(0, 0, 0, 0.1)')
                        .caCss('color', 'rgba(255,255,255, 0.8)')
                }

                var
                    pre = getElem('div'),
                    nex = getElem('div');

                ca.previous = pre;
                ca.next = nex;

                var fs = ($width + $height * 2) / ($width + $height) * 2;   // font-size
                initBtn(pre, fs, '<', over, out);
                initBtn(nex, fs, '>', over, out);

                pre.caCss('float', 'left');
                nex.caCss('float', 'right');

                click(pre, function () {
                    prev();
                });
                click(nex, function () {
                    next();
                });

                co.appendChild(pre);
                co.appendChild(nex);
            },
            initIndicators = function () {
                // var indicators = getElem('div');
                var indicators = getElem('ul');
                ca.indicators = indicators;
                indicators.caCss('list-style', 'none')
                    .caCss('padding', '0')
                    .caCss('position', 'absolute')
                    .caCss('bottom', '5%')
                    .caCss('width', '100%')
                    .caCss('height', '40px')
                    .caCss('display', 'flex')
                    .caCss('justify-content', 'center')
                    .caCss('align-items', 'center')
                    .caCss('margin', '0');

                $source.forEach(function (value, index) {
                    var li = getElem('li');
                    li.caCss('display', 'inline-block')
                        .caCss('width', '25px')
                        .caCss('height', '25px')
                        .caCss('color', '#fff')
                        .caCss('background-color', 'rgba(0,0,0,0.8)')
                        .caCss('font-family', '"Roboto", serif')
                        .caCss('margin', '0 5px')
                        .caCss('text-align', 'center')
                        .caCss('line-height', '25px')
                        .caCss('cursor', 'pointer');
                    li.innerText = index + 1;
                    hover(li, function (event, elem) {
                        if (!clicked && event.target !== currentIndicator) {
                            elem.caCss('background-color', 'hotpink');
                            clicked = false;
                        }
                    }, function (event, elem) {
                        if (!clicked && event.target !== currentIndicator) {
                            elem.caCss('background-color', 'rgba(0,0,0,0.8)');
                            clicked = false;
                        }
                    });
                    click(li, function () {
                        clicked = true;
                        jumpTo(index);
                    });
                    indicators.appendChild(li);
                });
                currentIndicator = indicators.children[0];
                renderActiveIndicator(currentIndicator);
            },
            autoScroll = function () {
                setInterval(function () {
                    next();
                }, $duration * 1000);
            },
            assembling = function () {
                ca.container.appendChild(ca.images);
                ca.cover.appendChild(ca.indicators);
                ca.container.appendChild(ca.cover);
            };

        var r = function () {
            initContainer();
            initImages();
            initCover();
            initIndicators();
            assembling();
            autoScroll();
        };
        return {
            id: function () {
                return id;
            },
            width: w,
            height: h,
            percent: p,
            duration: d,
            speed: s,
            images: i,
            render: r
        }
    }

    // register to scope
    scope.Carousel = Carousel;
}(typeof window === 'undefined' ? window : this));