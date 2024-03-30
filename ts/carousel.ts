var Carousel = (function() {
  class ArrayTool {
    public static IndexOf(array:Array<any>, item:any):number {
      const len = array.length
      for(let i=0; i<len; i++) {
        if(array[i] == item) return i
      }
      return -1
    }
  }
  class ElementTool {
    // 获取元素类名数组
    public static GetClassArray(el:Element):string[] {
      let className = el.className.replace(/\s+/g, " ").replace(/^\s*/g, "").replace(/\s*$/g, "")
      if(className == "") return []
      else return className.split(" ")
    }
    // 获取后代元素列表，通过属性
    public static GetElementsByAttrName(el:Element, attrName:string):HTMLElement[] {
      var result:Element[] = []
      var childrens = el.getElementsByTagName("*")
      for(var i=0; i < childrens.length; i++) {
        var children = childrens[i]
        if(children.nodeType == 1) {
          if(children.getAttributeNode(attrName) != null) {
            result.push(children);
          }
        }
      }
      return result as HTMLElement[]
    }
    // 获取后代元素，通过类名
    public static GetElementByClassName(el:Element, className:string):HTMLElement | null {
      var list = this.GetElementsByClassName(el, className);
      if(list.length > 0) return list[0];
      else return null;
    }
    // 获取后代元素列表，通过类名
    public static GetElementsByClassName(el:Element, className:string):HTMLElement[] {
      var result:Element[] = []
      var childrens = el.getElementsByTagName("*")
      for(var i=0; i < childrens.length; i++) {
        var children = childrens[i]
        if(children.nodeType == 1) {
          var classList = ElementTool.GetClassArray(children)
          if(ArrayTool.IndexOf(classList, className) != -1) {
            result.push(children)
          }
        }
      }
      return result as HTMLElement[]
    }
    // 为元素添加类名，不支持多个
    public static AddClassName(el:Element, className:string) {
      const list = ElementTool.GetClassArray(el)
      const index = ArrayTool.IndexOf(list, className)
      if(index == -1) {
        list.push(className)
      }
      el.className = list.join(" ")
    }
    // 为元素移除类名，不支持多个
    public static RemoveClassName(el:Element, className:string) {
      const list = ElementTool.GetClassArray(el)
      const index = ArrayTool.IndexOf(list, className)
      if(index != -1) {
        list.splice(index, 1)
      }
      el.className = list.join(" ")
    }
  }
  // 数值随时间变化
  function numsTransition(params:{
    current    : number
    target     : number
    frames     : number
    duration   : number
    callback   : (num:number, isEnd:boolean, close:()=>void) =>void
    transition : (x:number) => number
  }) {
    const { target, current, frames, duration, callback, transition} = params
    const t = new Date().getTime()
    const de = target - current
    function close() {
      if(timer) clearInterval(timer)
    }
    const timer = setInterval(() => {
      const x = Math.min((new Date().getTime() - t) / duration, 1)
      const y = transition(x)
      let cur = current + de * y
      const isEnd = x == 1
      if(isEnd) cur = target;
      callback && callback(cur, isEnd, close)
      isEnd && close()
    }, 1000 / frames)
  }

  class Carousel {
    private root:HTMLElement
    private slider:HTMLElement
    private size:number
    private index:number
    private isMoving:boolean

    private duration:number
    private transition:(x:number) => number

    private onStart?:Function
    private onEnd?:Function

    public static TransitionEase      = cubicBezier(.25, .1, .25, 1)
    public static TransitionLinear    = cubicBezier(0, 0, 1, 1)
    public static TransitionEaseIn    = cubicBezier(.42, 0, 1, 1)
    public static TransitionEaseOut   = cubicBezier(0, 0, .58, 1)
    public static TransitionEaseInOut = cubicBezier(.42, 0, .58, 1)
    constructor(root:HTMLElement, config?:{
        duration?:number
        transition?:(x:number) => number
        onStart?: Function
        onEnd?: Function
      }){


      var slider = ElementTool.GetElementByClassName(root, 'carousel-slider') as HTMLElement
      if(slider == null) {
        throw new Error('无法在 el 下找到 .carousel-slider') 
      }
      var items = ElementTool.GetElementsByClassName(slider, 'carousel-item')
      var size = items.length

      if(size == 0) {
        throw new Error("carousel-item 轮播图节点元素数量应该大于 0")
      }
      // 复制节点
      slider.appendChild(items[0].cloneNode(true))
      
      // 设置宽度
      slider.style.width = "" + ((size + 1 ) * items[0].clientWidth + 10)+ "px";
      // 为有data-carousel-go的元素绑定事件
      var carouselgos = ElementTool.GetElementsByAttrName(root, "data-carousel-go")
      var that = this
      for(var i=0; i<carouselgos.length; i++) {
        var item = carouselgos[i]
        var value = item.getAttributeNode("data-carousel-go").value
        if(value == "previous") {
          item.onclick = function() {
            that.previous()
          }
        } else if (value == "next") {
          item.onclick = function() {
            that.next()
          }
        } else {
          var goIndex = Math.floor(Number(value))
          if(goIndex > 0 && goIndex <= size) {
            (function (index) {
              item.onclick = function(){
                that.go(index)
              }
            })(goIndex - 1);
          }
        }
      }
      
      // 设置属性
      config = config || {}
      this.root = root
      this.slider = slider
      this.index = 0
      this.size = size
      this.isMoving = false
      this.duration = config.duration || 300
      this.transition = config.transition || Carousel.TransitionEase
      this.onStart = config.onStart
      this.onEnd = config.onEnd
    }
    public getIndex() {
      return this.index
    }
    private _startMoving() {
      this.isMoving = true
      this._defaultOnStart()
      if(this.onStart) {
        this.onStart()
      }
    }
    private _endMoving() {
      this.isMoving = false
      this._defaultOnEnd()
      if(this.onEnd) {
        this.onEnd()
      }
    }
    private _defaultOnStart() {
      var dots = ElementTool.GetElementsByClassName(this.root, "carousel-dot");
      if(dots.length == 0) return
      for(var i=0; i<dots.length; i++) {
        ElementTool.RemoveClassName(dots[i], 'carousel-dot--active')
      }
      ElementTool.AddClassName(dots[this.getIndex()], 'carousel-dot--active')
    }
    private _defaultOnEnd() {
      
    }
    public previous():boolean {
      if(this.isMoving) return false
      var that = this
      that.index--
      // 第一张处理
      if(that.index < 0) {
        that.index = that.size - 1
        that.slider.style.left = "" + (-that.size * that.root.clientWidth) + "px";
      }
      var tIndex = that.index
      this._startMoving()
      numsTransition({
        current  : that.slider.offsetLeft,
        target   : -tIndex * that.root.clientWidth,
        duration : that.duration,
        frames   : 240,
        transition: that.transition,
        callback(num, isEnd, close) {
          that.slider.style.left = "" + num + "px";
          if(isEnd) {
            that._endMoving()
          }
        }
      })
      return true
    }
    public next():boolean {
      if(this.isMoving) return false
      var that = this
      that.index++
      var tIndex = that.index
      if(that.index >= that.size) {
        that.index = 0
      }
      this._startMoving()

      numsTransition({
        current  : that.slider.offsetLeft,
        target   : -tIndex * that.root.clientWidth,
        duration : that.duration,
        frames   : 240,
        transition: that.transition,
        callback(num, isEnd, close) {
          that.slider.style.left = "" + num + "px";
          if(isEnd) {
            // 最后一张处理
            if(tIndex >= that.size) {
              that.slider.style.left = "" + 0 + "px";
            }
            that._endMoving()
          }
        }
      })
      return true
    }
    public go(index:number):boolean {
      if(this.isMoving) return false
      if(index < 0 || index >= this.size || index == this.index) return false
      // 闪现效果
      // this._startMoving()
      // this.index = index
      // this.slider.style.left = "" + this.root.clientWidth * this.index
      // this._endMoving()
      // 滑动效果
      var that = this
      this.index = index
      var tIndex = index
      that._startMoving()
      numsTransition({
        current  : that.slider.offsetLeft,
        target   : -tIndex * that.root.clientWidth,
        duration : that.duration,
        frames   : 240,
        transition: that.transition,
        callback(num, isEnd, close) {
          that.slider.style.left = "" + num + "px";
          if(isEnd) {
            that._endMoving()
          }
        }
      })
      return true
    }
  }

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
  function cubicBezier(p1x:number, p1y:number, p2x:number, p2y:number) {
    const ZERO_LIMIT = 1e-6;
    // Calculate the polynomial coefficients,
    // implicit first and last control points are (0,0) and (1,1).
    const ax = 3 * p1x - 3 * p2x + 1;
    const bx = 3 * p2x - 6 * p1x;
    const cx = 3 * p1x;

    const ay = 3 * p1y - 3 * p2y + 1;
    const by = 3 * p2y - 6 * p1y;
    const cy = 3 * p1y;

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
      let t2 = x;
      let derivative;
      let x2;
      // https://trac.webkit.org/browser/trunk/Source/WebCore/platform/animation
      // first try a few iterations of Newton's method -- normally very fast.
      // http://en.wikipedia.org/wikiNewton's_method
      for (let i = 0; i < 8; i++) {
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
      let t1 = 1;
      /* istanbul ignore next */
      let t0 = 0;
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
        } else {
          t0 = t2;
        }
        t2 = (t1 + t0) / 2;
      }
      // Failure
      return t2;
    }
    function solve(x:number) {
      return sampleCurveY(solveCurveX(x));
    }
    return solve
  }
  return Carousel
})()