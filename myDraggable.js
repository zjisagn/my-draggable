
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

    DragDrop.prototype.on = function () {
        this.watcher.on.apply(this.watcher, arguments)

        return this.watcher
    }

    function DragMove(el, option){
        this.option = option || {};
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

        // 开始移动
        function moveStart(e){
            that.isMoveStart = true;
            document.addEventListener(EVENTS[1], move);
            document.addEventListener(EVENTS[2], moveEnd);
            that.watcher.trigger(EVENTS[0], e, that.dragTarget);
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

    DragMove.prototype.on = function () {
        this.watcher.on.apply(this.watcher, arguments)

        return this.watcher
    }
    

    function Draggable(el, option){
        this.option = option || {};
        this.isOnlyDrag = this.option.isOnlyDrag;
        this.init(el);
    }


    Draggable.prototype.init = function(el){
        this.watcher = new Watcher();
        if(this.isOnlyDrag) {
            this.dragDrop = new DragDrop(el);
            this.bindDragEvent();
        } else {
            this.dragMove = new DragMove(el);
            this.dragDrop = new DragDrop(el, {
                draggable: false
            });
            this.bindMoveStartEvent();
            // 防止触发dragstart事件时候，且在移动过程中不会触发mousemove事件，松开鼠标也不会触发mouseup事件
            this.bindDragEvent();
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
            that.moveInfo.clientX = e.clientX;
            that.moveInfo.clientY = e.clientY;
            that.watcher.trigger('start', e, dragTarget);

        }

        // 移动
        function move(e, dragTarget){
            that.updateTargetLocation(e, dragTarget)
            that.watcher.trigger('move', e, dragTarget)
        }

        // 结束移动
        function moveEnd(e, dragTarget){
            that.watcher.trigger('end', e, dragTarget)       
        }

    }

    // 更新定位
    Draggable.prototype.updateTargetLocation = function(e, dragTarget){
        var left = e.clientX - this.moveInfo.clientX + dragTarget.offsetLeft;
        var top = e.clientY - this.moveInfo.clientY + dragTarget.offsetTop;

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

        dragTarget.style.left  = left + 'px'
        dragTarget.style.top   = top + 'px';
        dragTarget.style.zIndex = 19911125;

        this.moveInfo.clientX = e.clientX;
        this.moveInfo.clientY = e.clientY;
        this.moveInfo.left = left;
        this.moveInfo.top = top;
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
            if(that.isOnlyDrag !== true) {
                that.moveInfo.clientX = e.clientX;
                that.moveInfo.clientY = e.clientY;
                zIndex = dragTarget.style.zIndex;
            }
            that.watcher.trigger('dragstart', e, dragTarget);
        }

        // 拖拽中
        function drag(e, dragTarget){
            if(that.isOnlyDrag !== true) {
                that.moveInfo.lastMoveInfo = {
                    left: that.moveInfo.left,
                    top: that.moveInfo.top
                };
                that.updateTargetLocation(e, dragTarget)
                dragTarget.style.zIndex = INDEX_MAX;
            } 
            that.watcher.trigger('drag', e, dragTarget);
        }

        // 拖拽结束
        function dragend(e, dragTarget){
            if(that.isOnlyDrag !== true) {
                that.isMoveStart = false;
                dragTarget.style.zIndex = zIndex;
                // 在drag事件的触发过程中，松开鼠标时，还好触发一次drag事件，此时e.clientX和e.clientY都为0，会导致定位不准，所以重新定位一次。
                dragTarget.style.left  = that.moveInfo.lastMoveInfo.left + 'px'
                dragTarget.style.top   = that.moveInfo.lastMoveInfo.top + 'px';
            }
            that.watcher.trigger('dragend', e, dragTarget);
        }
    }

    Draggable.prototype.on = function () {
        this.watcher.on.apply(this.watcher, arguments)

        return this.watcher
    }

    return Draggable;
}))