
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory)
    } else if (typeof exports === 'object') {
        // Node, CommonJS
        module.exports = factory()
    } else {
        // Window
        root.MyDraggable = factory()
    }
}(this, function () {


    var EVENTS = ["mousedown", "mousemove", "mouseup"];
    var DRAG_EVENTS = ["dragstart", "drag", "dragend"];
    var INDEX_MAX = 99999
    function getDragTarget(el){
        var dragTarget;
        if(typeof el == 'string') {
            try {
                dragTarget = document.querySelector(el);
                if(!dragTarget) {
                    printInfo('Cannot find element: ' + el)
                }
            } catch (e) {
                printInfo(e)
            }
        } else if(el && el.nodeType == 1){
            dragTarget = el;
        }
        return dragTarget;
    }

    function printInfo(msg){
        console.log(msg);
    }

    //阻止事件冒泡
    function pauseEvent(e){
        if(e.stopPropagation) e.stopPropagation();

        if(e.preventDefault) e.preventDefault();

        e.cancelBubble=true;

        e.returnValue=false;
        return false;
    }


    var Watcher = function () {
        this.events = {}
    }

    Watcher.prototype = {

        on: function (type, fn) {
            this.getEventByType(type).push(fn)

            return this
        },

        trigger: function (type) {
            var event  = this.getEventByType(type)
            var params = Array.prototype.slice.call(arguments, 1)

            event.forEach(function (fn) {
                fn.apply(fn, params)
            })

            return this;
        },

        getEventByType: function (type) {
            if (!this.events[type]) this.events[type] = []

            return this.events[type]
        },

        remove: function (type, fn) {
            var event = this.getEventByType(type)

            if (!fn) {
                this.events[type] = []
            } else {
                event.splice(event.indexOf(fn), 1)
            }

            return this
        }
    }


    function DragDrop(el, option){
        this.option = option || {};
        this.watcher = new Watcher();
        this.init(el);
    }

    DragDrop.prototype.init = function(el){
        this.dragTarget = getDragTarget(el);
        if(!this.dragTarget) {
            printInfo( 'Failed to init dragTarget')
            return;
        }
        // 解绑时，还原属性
        this._dragTargetDraggable = this.dragTarget.getAttribute("draggable");
        if(this.option.draggable !== false) {
            this.dragTarget.setAttribute("draggable", "true")
        }
        this.bindDragEvent();
    }

    // 绑定开始移动事件
    DragDrop.prototype.bindDragEvent = function(){
        var that = this;
        that.dragTarget.addEventListener(DRAG_EVENTS[0], dragstart);
        that.dragTarget.addEventListener(DRAG_EVENTS[1], drag);
        that.dragTarget.addEventListener(DRAG_EVENTS[2], dragend);
        this.dragstartFun = dragstart;
        this.dragFun = drag;
        this.dragendFun = dragend;
        // 拖拽开始
        function dragstart(e){
            that.watcher.trigger(DRAG_EVENTS[0], e, that.dragTarget);
        }

        // 拖拽中
        function drag(e){
            that.watcher.trigger(DRAG_EVENTS[1], e, that.dragTarget);
        }

        // 拖拽结束
        function dragend(e){
            that.watcher.trigger(DRAG_EVENTS[2], e, that.dragTarget);
        }

    }

    DragDrop.prototype.unbind = function () {
        that.dragTarget.removeEventListener(DRAG_EVENTS[0], this.dragstartFun);
        that.dragTarget.removeEventListener(DRAG_EVENTS[1], this.dragFun);
        that.dragTarget.removeEventListener(DRAG_EVENTS[2], this.dragendFun);
        if(this._dragTargetDraggable != null) {
            this.dragTarget.setAttribute("draggable", this._dragTargetDraggable);
        } else {
            this.dragTarget.removeAttribute("draggable");
        }

    }

    DragDrop.prototype.on = function () {
        this.watcher.on.apply(this.watcher, arguments)

        return this.watcher
    }

    function DragMove(el, option){
        this.option = option || {};
        this.isParentsOffsetChange = false;
        if(this.option.isParentsOffsetChange != null) {
            this.isParentsOffsetChange = this.option.isParentsOffsetChange;
        }
        this.watcher = new Watcher();
        this.init(el);
    }

    DragMove.prototype.init = function(el){
        this.dragTarget = getDragTarget(el);
        if(!this.dragTarget) {
            printInfo( 'Failed to init dragTarget')
            return;
        }
        this.bindMoveStartEvent();
    }

    // 绑定开始移动事件
    DragMove.prototype.bindMoveStartEvent = function(){
        var that = this;
        that.isMoveStart = false;
        that.dragTarget.addEventListener(EVENTS[0], moveStart);
        var zIndex = that.dragTarget.style.zIndex;
        this.moveStartFun = moveStart;
        // 开始移动
        function moveStart(e){
            that.isMoveStart = true;
            document.addEventListener(EVENTS[1], move);
            document.addEventListener(EVENTS[2], moveEnd);
            that.watcher.trigger(EVENTS[0], e, that.dragTarget);
            // 防止触发了浏览器的 drag 操作，导致mouseup丢失。
            pauseEvent(e);
        }

        // 移动
        function move(e){
            if(!that.isMoveStart) {
                return;
            }
            that.dragTarget.style.zIndex = INDEX_MAX;
            document.addEventListener(EVENTS[1], move);
            document.addEventListener(EVENTS[2], moveEnd);
            that.watcher.trigger(EVENTS[1], e, that.dragTarget)
        }

        // 结束移动
        function moveEnd(e){
            that.isMoveStart = false;
            document.removeEventListener(EVENTS[1], move)
            document.removeEventListener(EVENTS[2], moveEnd)
            that.dragTarget.style.zIndex = zIndex;
            that.watcher.trigger(EVENTS[2], e, that.dragTarget)       
        }

    }

    DragMove.prototype.unbind = function () {
        that.dragTarget.removeEventListener(DRAG_EVENTS[0], this.moveStartFun);
    }

    DragMove.prototype.on = function () {
        this.watcher.on.apply(this.watcher, arguments)

        return this.watcher
    }
    

    function Draggable(el, option){
        this.option = option || {};
        this.isBindDrag = this.option.isBindDrag;
        this.isHandleBoundary = this.option.isHandleBoundary || false;
        this.init(el);
    }


    Draggable.prototype.init = function(el){
        this.watcher = new Watcher();
        if(this.isBindDrag) {
            this.dragDrop = new DragDrop(el);
            this.bindDragEvent();
        } else {
            this.dragMove = new DragMove(el);
            this.bindMoveStartEvent();
        }
    }

     // 绑定拖拽事件
     Draggable.prototype.bindDragEvent = function(){
        var that = this;
        this.dragDrop.on(DRAG_EVENTS[0], dragstart)
                     .on(DRAG_EVENTS[1], drag)
                     .on(DRAG_EVENTS[2], dragend);
        var zIndex;
        // 拖拽开始
        function dragstart(e, dragTarget){
            dragTarget = that.getDragTarget(dragTarget);
            that.watcher.trigger('dragstart', e, dragTarget);
        }

        // 拖拽中
        function drag(e, dragTarget){
            dragTarget = that.getDragTarget(dragTarget);
            that.watcher.trigger('drag', e, dragTarget);
        }

        // 拖拽结束
        function dragend(e, dragTarget){
            dragTarget = that.getDragTarget(dragTarget);
            that.watcher.trigger('dragend', e, dragTarget);
        }
    }


    // 绑定开始移动事件
    Draggable.prototype.bindMoveStartEvent = function(){
        var that = this;
        that.moveInfo = {};
        
        this.dragMove.on(EVENTS[0], moveStart)
                     .on(EVENTS[1], move)
                     .on(EVENTS[2], moveEnd)
        // 开始移动
        function moveStart(e, dragTarget){
            dragTarget = that.getDragTarget(dragTarget);
            that.moveInfo.clientX = e.clientX;
            that.moveInfo.clientY = e.clientY;
            var bcf = dragTarget.getBoundingClientRect();
            that.moveInfo.diffX = e.clientX - bcf.left;
            that.moveInfo.diffY = e.clientY - bcf.top;

            that.watcher.trigger(EVENTS[0], e, dragTarget);

        }

        // 移动
        function move(e, dragTarget){
            dragTarget = that.getDragTarget(dragTarget);
            that.updateTargetLocation(e, dragTarget)
            that.watcher.trigger(EVENTS[1], e, dragTarget)
        }

        // 结束移动
        function moveEnd(e, dragTarget){
            dragTarget = that.getDragTarget(dragTarget);
            that.watcher.trigger(EVENTS[2], e, dragTarget)       
        }

    }

    // 更新定位
    Draggable.prototype.getTargetLeftAndTop = function(e, dragTarget){
        var scrollLeft = this.getScrollLeft(dragTarget);
        var scrollTop = this.getScrollTop(dragTarget);
        var pOffset = this.getParentsOffsetSumProxy(dragTarget),
            left = e.clientX - this.moveInfo.diffX - pOffset.left + scrollLeft,
            top = e.clientY - this.moveInfo.diffY - pOffset.top + scrollTop;

        return {
            top: top,
            left: left
        }
    }

    // 获取纵向滚动条滚动高度
    Draggable.prototype.getScrollTop = function(dragTarget){    
        var scrollTop = 0;
        if(typeof this.option.getScrollTop == 'function') {
            try{
                scrollTop = this.option.getScrollTop(dragTarget)
            } catch(e){printInfo(e)}
        } else {
            if(document.documentElement&&document.documentElement.scrollTop){    
                scrollTop=document.documentElement.scrollTop;    
            }else if(document.body){    
                scrollTop=document.body.scrollTop;    
            }    
        }
        return scrollTop;    
    } 

    // 获取横向滚动条滚动高度
    Draggable.prototype.getScrollLeft = function(dragTarget){    
        var scrollLeft = 0;    
        if(typeof this.option.getScrollLeft == 'function') {
            try{
                scrollLeft = this.option.getScrollLeft(dragTarget)
            } catch(e){printInfo(e)}
        } else {
            if(document.documentElement&&document.documentElement.scrollLeft){    
                scrollLeft=document.documentElement.scrollLeft;    
            } else if(document.body){    
                scrollLeft=document.body.scrollLeft;    
            }    
        }
        return scrollLeft;    
    } 



     // 获取定位信息
     Draggable.prototype.getTargetLeftAndTop2 = function(e, dragTarget){

        var left = e.clientX - this.moveInfo.clientX + dragTarget.offsetLeft;
        var top = e.clientY - this.moveInfo.clientY + dragTarget.offsetTop;

        return {
            top: top,
            left: left
        }

    }

    Draggable.prototype.getParentsOffsetSum = function(dragTarget){
        var top = 0;
        var left = 0;
        var offsetParent = dragTarget && dragTarget.offsetParent
        while(offsetParent) {
            top += offsetParent.offsetTop;
            left += offsetParent.offsetLeft;
            offsetParent = offsetParent.offsetParent;
        }

        return {
            top: top,
            left: left
        }
    }

    Draggable.prototype.getParentsOffsetSumProxy = function(dragTarget){
       if(!this.isParentsOffsetChange && this.parentsOffsetSumCache != null) {
            return  this.parentsOffsetSumCache
       }
       this.parentsOffsetSumCache = this.getParentsOffsetSum(dragTarget);
       return this.parentsOffsetSumCache;
    }
    
    // 更新定位
    Draggable.prototype.updateTargetLocation = function(e, dragTarget){
        var lt = this.getTargetLeftAndTop(e, dragTarget);

        lt = this.handleBoundaryConditionProxy(lt, dragTarget)
        
        var left = lt.left;
        var top = lt.top;

        dragTarget.style.left  = left + 'px'
        dragTarget.style.top   = top + 'px';
        dragTarget.style.zIndex = 19911125;

        this.moveInfo.clientX = e.clientX;
        this.moveInfo.clientY = e.clientY;
        this.moveInfo.left = left;
        this.moveInfo.top = top;
    }

    // 获取拖拽目标dom
    Draggable.prototype.getDragTarget = function(dragTarget){

        if(typeof this.option.getDragTarget == 'function') {
            try{
                dragTarget = this.option.getDragTarget(dragTarget);
            } catch(e){printInfo(e)}
        }

        return dragTarget;
    }


     // 处理边界情况代理
     Draggable.prototype.handleBoundaryConditionProxy = function(leftTop, dragTarget){
        var result = leftTop;
        if(this.isHandleBoundary) {
            if(typeof this.option.handleBoundaryCondition == 'function') {
                try{
                    result = this.option.handleBoundaryCondition(leftTop, dragTarget)
                } catch(e){printInfo(e)}
            } else {
                result = this.handleBoundaryCondition(leftTop, dragTarget);
            }
        }
        return result;
     }

    // 处理边界情况
    Draggable.prototype.handleBoundaryCondition = function(leftTop, dragTarget){
        var left = leftTop.left;
        var top = leftTop.top;

        var width    = dragTarget.offsetWidth;
        var height   = dragTarget.offsetHeight;
        var minLeft = this.option.minLeft || 0;
        var minTop = this.option.minTop || 0;
        var maxLeft = this.option.maxLeft || document.documentElement.clientWidth;
        var maxTop = this.option.maxTop || document.documentElement.clientHeight;

        if(left < minLeft) {
            left = minLeft;
        }

        if(left + width > maxLeft) {
            left = maxLeft - width;
        }

        if(top < minTop) {
            top = minTop;
        }

        if(top + height > maxTop) {
            top = maxTop - height;
        }

        return {
            top: top,
            left: left
        }
     }


    
    Draggable.prototype.on = function () {
        this.watcher.on.apply(this.watcher, arguments)

        return this.watcher
    }

    Draggable.prototype.unbind = function () {
        this.dragMove && this.dragMove.unbind();
        this.dragDrop && this.dragDrop.unbind();
    }

    return Draggable;
}))