/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * @class NodeView
 * @module modules
 */

define([],  function(){


    var NodeView = Backbone.View.extend({

        /**
         * The initialization method of this object.
         * @method initialize
         * @param {Map} A map of parameters
         */
        initialize: function(){
            this.environment = this.options.environment;
            this.bgplay = this.environment.bgplay;
            this.fileRoot = this.environment.fileRoot;
            this.eventAggregator = this.environment.eventAggregator;

            this.model = this.options.model;
            this.id = this.model.id;
            this.model.view = this;
            this.paper = this.options.paper;
            this.paperOriginalWidth = this.paper.width; //Used by Mustache.js
            this.paperOriginalHeight = this.paper.height; //Used by Mustache.js
            this.graphView = this.options.graphView;
            this.visible = this.options.visible;
            //this.x = Math.floor(Math.random()*100);
            this.x = 0;
            this.y = 0;
            //this.y = Math.floor(Math.random()*100);
            this.oldX = this.x;
            this.oldY = this.y;
            this.selected = false;
            this.neighbors = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys: false, suppressDuplicateKeyAlerts: true});
            this.nodeWidth = this.environment.config.graph.nodeWidth;
            this.nodeHeight = this.environment.config.graph.nodeHeight;

            this.render();
            this.eventsManager();
        },

        listeners: function(){
            return {
                "destroyAll": this.destroyMe,

                "updateNodesPosition": this.updatePosition,

                "styleElement": function(style){
                    if (!this.selected && this.visible){
                        this.setSvgStyle(style);
                    }
                },

                "nodeSelected": function(node){
                    if (node == this){
                        this.highlight(true);
                    }
                },

                "nodeReleased": function(node){
                    if (node == this){
                        this.highlight(false);
                    }
                }

            }
        },

        eventsManager: function(){
            var listeners, listener;
            listeners = this.listeners();

            for (listener in listeners){
                this.eventAggregator.on(listener, listeners[listener], this);
            }

            this.model.on('change', this.render, this);
        },

        /**
         * This method is used to update the position of the SVG representation of the node.
         * The new position will be (this.x,this.y) of this NodeView.
         * @method updatePosition
         */
        updatePosition: function(){
            if (this.oldX != this.x || this.oldY != this.y ) {
                this.view[0].attr({x: this.x - this.nodeWidth / 2, y: this.y - this.nodeHeight / 2});
                this.view[1].attr({x: this.x, y: this.y});
                this.oldX = this.x;
                this.oldY = this.y;
                this.eventAggregator.trigger("nodeMoved", this.model);
            }
        },

        /**
         * This method is used to translate the position of the SVG representation of the node.
         * The current position will be translated of (x,y) passed as parameters.
         * @method translate
         * @param {Float} The x position
         * @param {Float} The y position
         */
        translate: function(x, y, $this){
            if (!$this)
                $this = this;

            $this.view.translate(x,y);
            $this.x += x;
            $this.y += y;
            $this.eventAggregator.trigger("nodeMoved", $this.model);
        },

        /**
         * This method draws this module (eg. inject the DOM and elements).
         * @method render
         */
        render: function(){
            var radiusForRoundedCorners, svgNode, svgText, group;
            radiusForRoundedCorners = 10;

            svgNode = this.paper.rect(this.x - this.nodeWidth / 2, this.y - this.nodeHeight / 2, this.nodeWidth, this.nodeHeight, radiusForRoundedCorners)
                .attr({fill: this.getFillColor(), stroke:this.getStrokeColor(),"text-anchor": "middle"});

            svgText = this.paper.text(this.x, this.y, this.getLabel())
                .attr({'fill': this.getTextFillColor(), 'font-family': 'Arial', 'font-size': this.environment.config.graph.nodeTextFontSize, 'font-weight': 'bold'});

            group = this.paper.set();
            group.push(svgNode);
            group.push(svgText);
            svgNode["set"] = group;
            svgText["set"] = group;

            svgNode.parentGroup = group;
            svgText.parentGroup = group;

            this.paper.graphSet.push(svgNode);
            this.paper.graphSet.push(svgText);

            if (this.visible == false){
                group.hide();
            }else{
                group.show();
            }

            this.el = group.node;
            this.view = group;

            $(svgNode.node).css("cursor","pointer");
            $(svgText.node).css("cursor","pointer");

            this.loadSvgEvents();
            return this;
        },

        selectedStyle: function(){

            if (this.visible && !this.pruned) {
                this.view[0].attr(
                    {
                        opacity: 0.8,
                        fill: "#E3F8FA",
                        stroke: this.getStrokeColor()
                    });

                this.view[1].attr(
                    {
                        'fill': this.getTextFillColor()
                    });
            }

        },

        unSelectedStyle: function(){

            if (this.visible && !this.pruned) {
                this.view[0].attr({
                    opacity: 1,
                    fill: this.getFillColor()
                });
            }

        },

        select: function(){
            if (arrayContains(this.graphView.selectedNodes, this) == false){
                this.graphView.selectedNodes.push(this);
                this.selected = true;
                this.selectedStyle();

                var $this = this;
                this.selecChildrenTimer = setTimeout(function(){
                    $this.eventAggregator.trigger("selectChildren", $this.model);
                }, $this.environment.config.graph.nodeSelectChildrenMilliseconds);

            }else{
                this.graphView.selectedNodes = removeArrayElement(this.graphView.selectedNodes,this);
                this.selected = false;
                this.unSelectedStyle();
            }
            this.dragging = false;
        },

        /**
         * This method manages the events for the SVG representation.
         * @method loadSvgEvents
         */
        loadSvgEvents: function(){
            if (!isMobileBrowser()){
                var $this;
                $this = this;
                $this.clicks=0;

                $(this.view[1].node).mouseenter(function(evt){
                    if (!$this.dragging && !$this.pruned){
                        eventStopPropagation(evt);

                        $this.mouseoverTimer = setTimeout(function(){
                            $this.eventAggregator.trigger("styleElement", {opacity: $this.environment.config.graph.notSelectedElementOpacity});
//                            $this.setSvgStyle({opacity: 1});
                            $this.eventAggregator.trigger("nodeSelected", $this);
                            $this.eventAggregator.trigger("checkPathPosition");
                        }, $this.environment.config.graph.nodeMouseoverMilliseconds);

                    }
                });


                $(this.view[1].node).mouseleave(function(evt){
                    if (!$this.dragging && !$this.pruned){
                        clearTimeout($this.mouseoverTimer);
                        eventStopPropagation(evt);
                        $this.eventAggregator.trigger("styleElement",{opacity: 1});
                        $this.eventAggregator.trigger("nodeReleased", $this);
                        $this.eventAggregator.trigger("checkPathPosition");
                    }
                });

                function removeClicks(){
                    $this.clicks = 0;
                }

                $(this.paper.node).dblclick(function(event){
                    if ($($(event.target).context.parentNode).hasClass('bgplayNodeContainer')){
                        eventStopPropagation(event);
                        $this.unSelectedStyle();
                        $this.selected=false;
                    }
                });

                function singleClick(event){
                    eventStopPropagation(event);
                    event.preventDefault();
                    $this.view.toFront();
                    $this.ox = event.screenX;
                    $this.oy = event.screenY;
                    $this.selectedStyle();
                    $this.dragging = true;
                    clearTimeout($this.mouseoverTimer);
                }

                function doubleClick(event){
                    eventStopPropagation(event);
                    event.preventDefault();
                    $this.select();
                }

                $(this.view[0].node).add(this.view[1].node).mousedown(function(event) {
                    if ($($(event.target).context.parentNode).hasClass('bgplayNodeContainer')==false){
                        $this.clicks++;
                        setTimeout(removeClicks,$this.environment.config.doubleClickTimeInterval);
                        if($this.clicks>1){
                            removeClicks();
                            doubleClick(event);
                        }else{
                            singleClick(event);
                        }
                    }
                });


                this.paper.node.mouseleave(function(event){
                    eventStopPropagation(event);
                    $this.dragging = false;
                });

                this.paper.node.mousemove(function(event) {
                    if ($this.dragging == true) {
                        if ($this.selected)$this.graphView.draggingNodes = true;
                        var x = (event.screenX - $this.ox) * $this.paper["scale"];
                        var y = (event.screenY - $this.oy) * $this.paper["scale"];
                        $this.translate(x,y,$this);
                        $this.ox = event.screenX;
                        $this.oy = event.screenY;
                        if ($this.graphView.draggingNodes==true && $this.selected==true){
                            $this.graphView.selectedNodes.forEach(function(node){
                                if (node.id != $this.id){
                                    node.translate(x,y,node);
                                }
                            });
                        }
                    }
                });

                this.paper.node.mouseup(function(event) {
                    eventStopPropagation(event);
                    if($this.selected == false){
                        $this.unSelectedStyle();
                    }
                    $this.dragging = false;
                    $this.graphView.draggingNodes = false;
                    clearTimeout($this.selecChildrenTimer);
                });
            }
        },

        setSvgStyle: function(style){
            var view = this.view;

            if (view != null && !this.pruned){
                for(var key in style){ //it is a map!
                    if (view.attr(key) != style[key]){ //There is a difference
                        view.attr(style);
                        break;
                    }
                }
            }
        },

        /**
         * This method returns the background colour of the node.
         * @method getFillColor
         * @return {String} An hexadecimal colour
         */
        getFillColor: function(){
            var color;
            switch(this.bgplay.get("type")){
                default:
                    if (this.model.get("targets").length > 0){
                        color = this.environment.config.graph.targetColor;
                    }else if (this.model.get("sources").length > 0){
                        color = this.environment.config.graph.sourceColor;
                    }else{
                        color = this.environment.config.graph.nodeColor;
                    }
                    break;
            }
            return color;
        },

        /**
         * This method returns the border colour of the node.
         * @method getStrokeColor
         * @return {String} An hexadecimal colour
         */
        getStrokeColor:function(){
            var color;
            switch(this.bgplay.get("type")){
                default:
                    if (this.model.get("targets").length > 0){
                        color = this.environment.config.graph.targetBorderColor;
                    }else if (this.model.get("sources").length > 0){
                        color = this.environment.config.graph.sourceBorderColor;
                    }else{
                        color = this.environment.config.graph.nodeBorderColor;
                    }
                    break;
            }
            return color;
        },

        /**
         * This method returns the text colour of the node.
         * @method getTextFillColor
         * @return {String} An hexadecimal colour
         */
        getTextFillColor: function(){
            var color;
            switch(this.bgplay.get("type")){
                default:
                    if (this.model.get("sources").length > 0){
                        color=this.environment.config.graph.sourceTextColor;
                    }else if (this.model.get("targets").length > 0){
                        color=this.environment.config.graph.targetTextColor;
                    }else{
                        color=this.environment.config.graph.nodeTextColor;
                    }
                    break;
            }
            return color;
        },

        /**
         * This method returns the label of the node.
         * @method getLabel
         * @return {String} The label of the node
         */
        getLabel: function(){
            return this.model.toString();
        },

        /**
         * This method highlights the node.
         * @method highlight
         * @param {Boolean} if true the node will be highlighted
         */
        highlight: function(light){
            if (!this.selected){
                if (light){
                    this.view[0].attr(
                        {
                            fill: this.getTextFillColor(),
                            stroke:this.getFillColor()
                        });

                    this.view[1].attr(
                        {
                            'fill':this.getFillColor()
                        });
                }else{
                    this.view[0].attr(
                        {
                            fill: this.getFillColor(),
                            stroke:this.getStrokeColor()
                        });

                    this.view[1].attr(
                        {
                            'fill':this.getTextFillColor()
                        });
                }
            }
        },

        addNeighbor: function(node){
            this.neighbors.put(node.id, node);
        },

        getNeighbors: function(){
            return this.neighbors.toArray();
        }

    });

    return NodeView;
});