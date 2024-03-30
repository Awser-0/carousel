var Carousel = (function () {
    var ArrayTool = /** @class */ (function () {
        function ArrayTool() {
        }
        ArrayTool.IndexOf = function (array, item) {
            var len = array.length;
            for (var i = 0; i < len; i++) {
                if (array[i] == item)
                    return i;
            }
            return -1;
        };
        return ArrayTool;
    }());
    var ElementTool = /** @class */ (function () {
        function ElementTool() {
        }
        // 获取元素类名数组
        ElementTool.GetClassArray = function (el) {
            var className = el.className.replace(/\s+/g, " ").replace(/^\s*/g, "").replace(/\s*$/g, "");
            if (className == "")
                return [];
            else
                return className.split(" ");
        };
        // 获取后代元素列表，通过属性
        ElementTool.GetElementsByAttrName = function (el, attrName) {
            var result = [];
            var childrens = el.getElementsByTagName("*");
            for (var i = 0; i < childrens.length; i++) {
                var children = childrens[i];
                if (children.nodeType == 1) {
                    if (children.getAttributeNode(attrName) != null) {
                        result.push(children);
                    }
                }
            }
            return result;
        };
        // 获取后代元素，通过类名
        ElementTool.GetElementByClassName = function (el, className) {
            var list = this.GetElementsByClassName(el, className);
            if (list.length > 0)
                return list[0];
            else
                return null;
        };
        // 获取后代元素列表，通过类名
        ElementTool.GetElementsByClassName = function (el, className) {
            var result = [];
            var childrens = el.getElementsByTagName("*");
            for (var i = 0; i < childrens.length; i++) {
                var children = childrens[i];
                if (children.nodeType == 1) {
                    var classList = ElementTool.GetClassArray(children);
                    if (ArrayTool.IndexOf(classList, className) != -1) {
                        result.push(children);
                    }
                }
            }
            return result;
        };
        // 为元素添加类名，不支持多个
        ElementTool.AddClassName = function (el, className) {
            var list = ElementTool.GetClassArray(el);
            var index = ArrayTool.IndexOf(list, className);
            if (index == -1) {
                list.push(className);
            }
            el.className = list.join(" ");
        };
        // 为元素移除类名，不支持多个
        ElementTool.RemoveClassName = function (el, className) {
            var list = ElementTool.GetClassArray(el);
            var index = ArrayTool.IndexOf(list, className);
            if (index != -1) {
                list.splice(index, 1);
            }
            el.className = list.join(" ");
        };
        return ElementTool;
    }());
    // 数值随时间变化
    function numsTransition(params) {
        var target = params.target, current = params.current, frames = params.frames, duration = params.duration, callback = params.callback, transition = params.transition;
        var t = new Date().getTime();
        var de = target - current;
        function close() {
            if (timer)
                clearInterval(timer);
        }
        var timer = setInterval(function () {
            var x = Math.min((new Date().getTime() - t) / duration, 1);
            var y = transition(x);
            var cur = current + de * y;
            var isEnd = x == 1;
            if (isEnd)
                cur = target;
            callback && callback(cur, isEnd, close);
            isEnd && close();
        }, 1000 / frames);
    }
    var Carousel = /** @class */ (function () {
        function Carousel(root, config) {
            var slider = ElementTool.GetElementByClassName(root, 'carousel-slider');
            if (slider == null) {
                throw new Error('无法在 el 下找到 .carousel-slider');
            }
            var items = ElementTool.GetElementsByClassName(slider, 'carousel-item');
            var size = items.length;
            if (size == 0) {
                throw new Error("carousel-item 轮播图节点元素数量应该大于 0");
            }
            // 复制节点
            slider.appendChild(items[0].cloneNode(true));
            // 设置宽度
            slider.style.width = "" + ((size + 1) * items[0].clientWidth + 10) + "px";
            // 为有data-carousel-go的元素绑定事件
            var carouselgos = ElementTool.GetElementsByAttrName(root, "data-carousel-go");
            var that = this;
            for (var i = 0; i < carouselgos.length; i++) {
                var item = carouselgos[i];
                var value = item.getAttributeNode("data-carousel-go").value;
                if (value == "previous") {
                    item.onclick = function () {
                        that.previous();
                    };
                }
                else if (value == "next") {
                    item.onclick = function () {
                        that.next();
                    };
                }
                else {
                    var goIndex = Math.floor(Number(value));
                    if (goIndex > 0 && goIndex <= size) {
                        (function (index) {
                            item.onclick = function () {
                                that.go(index);
                            };
                        })(goIndex - 1);
                    }
                }
            }
            // 设置属性
            config = config || {};
            this.root = root;
            this.slider = slider;
            this.index = 0;
            this.size = size;
            this.isMoving = false;
            this.duration = config.duration || 300;
            this.transition = config.transition || Carousel.TransitionEase;
            this.onStart = config.onStart;
            this.onEnd = config.onEnd;
        }
        Carousel.prototype.getIndex = function () {
            return this.index;
        };
        Carousel.prototype._startMoving = function () {
            this.isMoving = true;
            this._defaultOnStart();
            if (this.onStart) {
                this.onStart();
            }
        };
        Carousel.prototype._endMoving = function () {
            this.isMoving = false;
            this._defaultOnEnd();
            if (this.onEnd) {
                this.onEnd();
            }
        };
        Carousel.prototype._defaultOnStart = function () {
            var dots = ElementTool.GetElementsByClassName(this.root, "carousel-dot");
            if (dots.length == 0)
                return;
            for (var i = 0; i < dots.length; i++) {
                ElementTool.RemoveClassName(dots[i], 'carousel-dot--active');
            }
            ElementTool.AddClassName(dots[this.getIndex()], 'carousel-dot--active');
        };
        Carousel.prototype._defaultOnEnd = function () {
        };
        Carousel.prototype.previous = function () {
            if (this.isMoving)
                return false;
            var that = this;
            that.index--;
            // 第一张处理
            if (that.index < 0) {
                that.index = that.size - 1;
                that.slider.style.left = "" + (-that.size * that.root.clientWidth) + "px";
            }
            var tIndex = that.index;
            this._startMoving();
            numsTransition({
                current: that.slider.offsetLeft,
                target: -tIndex * that.root.clientWidth,
                duration: that.duration,
                frames: 240,
                transition: that.transition,
                callback: function (num, isEnd, close) {
                    that.slider.style.left = "" + num + "px";
                    if (isEnd) {
                        that._endMoving();
                    }
                }
            });
            return true;
        };
        Carousel.prototype.next = function () {
            if (this.isMoving)
                return false;
            var that = this;
            that.index++;
            var tIndex = that.index;
            if (that.index >= that.size) {
                that.index = 0;
            }
            this._startMoving();
            numsTransition({
                current: that.slider.offsetLeft,
                target: -tIndex * that.root.clientWidth,
                duration: that.duration,
                frames: 240,
                transition: that.transition,
                callback: function (num, isEnd, close) {
                    that.slider.style.left = "" + num + "px";
                    if (isEnd) {
                        // 最后一张处理
                        if (tIndex >= that.size) {
                            that.slider.style.left = "" + 0 + "px";
                        }
                        that._endMoving();
                    }
                }
            });
            return true;
        };
        Carousel.prototype.go = function (index) {
            if (this.isMoving)
                return false;
            if (index < 0 || index >= this.size || index == this.index)
                return false;
            // 闪现效果
            // this._startMoving()
            // this.index = index
            // this.slider.style.left = "" + this.root.clientWidth * this.index
            // this._endMoving()
            // 滑动效果
            var that = this;
            this.index = index;
            var tIndex = index;
            that._startMoving();
            numsTransition({
                current: that.slider.offsetLeft,
                target: -tIndex * that.root.clientWidth,
                duration: that.duration,
                frames: 240,
                transition: that.transition,
                callback: function (num, isEnd, close) {
                    that.slider.style.left = "" + num + "px";
                    if (isEnd) {
                        that._endMoving();
                    }
                }
            });
            return true;
        };
        Carousel.TransitionEase = cubicBezier(.25, .1, .25, 1);
        Carousel.TransitionLinear = cubicBezier(0, 0, 1, 1);
        Carousel.TransitionEaseIn = cubicBezier(.42, 0, 1, 1);
        Carousel.TransitionEaseOut = cubicBezier(0, 0, .58, 1);
        Carousel.TransitionEaseInOut = cubicBezier(.42, 0, .58, 1);
        return Carousel;
    }());
    // index           = 0,
    // frames          = 300,
    // duration        = 300,
    // autoPlay        = false,
    // autoPlayTimeout = 1500,
    // onSlideStart    = null,
    // onSlideEnd      = null,
    // transition      = Carousel.TransitionEase,
    // carousel_slider_class = 'carousel-slider',
    // carousel_item_class   = 'carousel-item',
    // 三次贝赛尔曲线，抄的，原理还没懂
    function cubicBezier(p1x, p1y, p2x, p2y) {
        var ZERO_LIMIT = 1e-6;
        // Calculate the polynomial coefficients,
        // implicit first and last control points are (0,0) and (1,1).
        var ax = 3 * p1x - 3 * p2x + 1;
        var bx = 3 * p2x - 6 * p1x;
        var cx = 3 * p1x;
        var ay = 3 * p1y - 3 * p2y + 1;
        var by = 3 * p2y - 6 * p1y;
        var cy = 3 * p1y;
        function sampleCurveDerivativeX(t) {
            // `ax t^3 + bx t^2 + cx t` expanded using Horner's rule
            return (3 * ax * t + 2 * bx) * t + cx;
        }
        function sampleCurveX(t) {
            return ((ax * t + bx) * t + cx) * t;
        }
        function sampleCurveY(t) {
            return ((ay * t + by) * t + cy) * t;
        }
        // Given an x value, find a parametric value it came from.
        function solveCurveX(x) {
            var t2 = x;
            var derivative;
            var x2;
            // https://trac.webkit.org/browser/trunk/Source/WebCore/platform/animation
            // first try a few iterations of Newton's method -- normally very fast.
            // http://en.wikipedia.org/wikiNewton's_method
            for (var i = 0; i < 8; i++) {
                // f(t) - x = 0
                x2 = sampleCurveX(t2) - x;
                if (Math.abs(x2) < ZERO_LIMIT) {
                    return t2;
                }
                derivative = sampleCurveDerivativeX(t2);
                // == 0, failure
                /* istanbul ignore if */
                if (Math.abs(derivative) < ZERO_LIMIT) {
                    break;
                }
                t2 -= x2 / derivative;
            }
            // Fall back to the bisection method for reliability.
            // bisection
            // http://en.wikipedia.org/wiki/Bisection_method
            var t1 = 1;
            /* istanbul ignore next */
            var t0 = 0;
            /* istanbul ignore next */
            t2 = x;
            /* istanbul ignore next */
            while (t1 > t0) {
                x2 = sampleCurveX(t2) - x;
                if (Math.abs(x2) < ZERO_LIMIT) {
                    return t2;
                }
                if (x2 > 0) {
                    t1 = t2;
                }
                else {
                    t0 = t2;
                }
                t2 = (t1 + t0) / 2;
            }
            // Failure
            return t2;
        }
        function solve(x) {
            return sampleCurveY(solveCurveX(x));
        }
        return solve;
    }
    return Carousel;
})();
