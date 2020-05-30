
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory)
    } else if (typeof exports === 'object') {
        // Node, CommonJS
        module.exports = factory()
    } else {
        // Window
        root.DragDrop = factory()
    }
}(this, function () {

    var DRAG_EVENTS = ["dragstart", "drag", "dragend"];

    function DragDrop(el, option){
        this.option = option || {};
        this.init(el);
    }

    DragDrop.prototype.init = function(el){
        this.initDragTarget(el);
        if(!this.dragTarget) {
            return;
        }
        this.events = [];
        this.dragTarget.setAttribute("draggable", "true")
        this.bindDragEvent();
    }

     // 初始化要拖拽的对象
     DragDrop.prototype.initDragTarget = function(el){
        if(typeof el == 'string') {
            try {
                this.dragTarget = document.querySelector(el);
                if(!this.dragTarget) {
                    this.printInfo('Cannot find element: ' + el)
                }
            } catch (e) {
                this.printInfo(e)
            }
        } else if(el && el.nodeType == 1){
            this.dragTarget = el;
        }
        if(!this.dragTarget) {
            this.printInfo( 'Failed to init dragTarget')
        }
    }

    // 绑定开始移动事件
    DragDrop.prototype.bindDragEvent = function(){
        var that = this;
        that.dragTarget.addEventListener(DRAG_EVENTS[0], dragstart);
        that.dragTarget.addEventListener(DRAG_EVENTS[1], drag);
        that.dragTarget.addEventListener(DRAG_EVENTS[2], dragend);

        // 拖拽开始
        function dragstart(e){
            that.trigger('dragstart', e, that.dragTarget);
        }

        // 拖拽中
        function drag(e){
            that.trigger('drag', e, that.dragTarget);
        }

        // 拖拽结束
        function dragend(e){
            that.trigger('dragend', e, that.dragTarget);
        }

    }

    // 绑定事件
    DragDrop.prototype.on = function (name, fn) {
        if(name && typeof fn === 'function') {
            if(this.events[name]) {
                this.events[name].push(fn);
            } else {
                this.events[name] = [fn];
            } 
        }
        return this;
    }

    // 触发事件
    DragDrop.prototype.trigger =  function (name) {
        var event  = this.events[name] || [];
        var params = Array.prototype.slice.call(arguments, 1)

        event.forEach(function (fn) {
            fn.apply(fn, params)
        })

        return this;
    }

    return DragDrop;

}))
