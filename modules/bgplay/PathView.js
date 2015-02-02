/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * @class PathView
 * @module modules
 */

define([],  function(){


    var PathView = Backbone.View.extend({

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
            this.source = this.options.source;
            this.target = this.options.target;
            this.path = this.options.path;
            this.drawnArcs = [];
            this.paper = this.options.paper;
            this.key = this.source.id + "-" + this.target.id;
            this.visible = this.options.visible;
            this.graphView = this.options.graphView;
            this.selected = false;
            this.animateNextEvent = true;
            this.animationSpeed = 1;
            this.beamWidth = (this.environment.config.graph.nodeHeight / 100) * 90;

            this.eventsManager();
        },

        listeners: function(){
            return {
                "destroyAll": this.destroyMe,

                "nodeMoved redrawPathsOnThisNode": function(node){ //These events cause the update of the representation
                    if (this.path != null && this.path.contains(node)){
                        this.updateWithoutAnimation(true);
                    }
                },

                "firstPathDraw": this.firstDraw,

                "pathSelected": function(pathView){
                    if (pathView == this){
                        this.selectSVGPath();
                    }
                },

                "subTreeSelected": function(subTreeId){
                    if (this.svgPath != null && this.visible && this.subTreeId != null && this.subTreeId == subTreeId){
                        this.selectSVGPath();
                    }
                },

                "nodeSelected": function(nodeView){
                    if (this.svgPath != null && this.visible && this.path!=null && this.path.contains(nodeView.model)){

                        if (this.subTreeId != null){
                            this.inFront();
                            this.selectSVGPath();
                        }else{
                            this.selectSVGPath();
                        }

                    }
                },

                "selectChildren": function(node){
                    if (this.visible && this.path && this.svgPath){
                        var nodes, n, contained, tmpNode;
                        nodes = this.path.get("nodes");
                        contained = false;
                        for (n = nodes.length-1; n>=0; n--){
                            tmpNode = nodes[n];
                            if (!contained){
                                contained = (node.id == tmpNode.id);
                            }else if (!tmpNode.view.selected){
                                tmpNode.view.select();
                            }
                        }
                    }
                },

                "checkPathPosition redrawPaths": function(){ //This event forces all paths to redraw themselves
                    if (this.visible){
                        this.updateWithoutAnimation(true);
                    }
                },

                "animationSpeedChanged": function(value){ //This event changes the animation speed
                    this.animationSpeed = value;
                },

                "styleElement": this.setSvgStyle
            }
        },


        eventsManager: function(){
            var listeners, listener;
            listeners = this.listeners();

            for (listener in listeners){
                this.eventAggregator.on(listener, listeners[listener], this);
            }

            this.eventAggregator.on('animateNextEvent', function(animate){ //This event prevents the animation of the next event
                this.animateNextEvent = animate;
            },this);

            this.source.on('curEventChange', function(event){ // This event occurs when a new event has been applied
                if (event.get("target")==this.target){ //Each PathView is a subscriber of its source.
                    this.visible=true;
                    this.setVisibility();

                    // IMPORTANT!!! It is very important to apply first the precedent event of the current event.
                    // For example would be impossible to apply a path change or a withdrawal to an non-existent path.
                    // The user can jump to events temporally distant, in this case the sequence of events becomes senseless (i.e. a path change after a withdrawal).
                    if (event.get("type") != "initialstate"){
                        this.restoreCondition(event);
                    }

                    this.updatePath(event);
                }
            },this);

            // The user can jump back in time, if the first event A for the source S happened at T1
            // and the user jumps to T2, where T2<T1, the curEvent changes but is Null!
            // In this case the 'curEventChange' will be not triggered, to prevent 'undefined', and will be replaced by
            // 'curEventNull' (containing the last event not null, in order to know what should be deleted).
            this.source.on('curEventNull', function(event){//Look! This receives the last not null event, not the current!
                if (event != null && event.get("target") == this.target){//THIS IS NOT A WITHDRAWAL, there isn't any route to delete because it never existed!
                    this.visible = false;
                    this.setVisibility();
                }
            },this);

        },

        updateAllEdgeInCommon: function($this){
            var path1,path2, n, tmpNode, nodes1, nodes2, length1, length2, notCommonNodes;
            notCommonNodes = [];
            path1 = $this.path;
            path2 = $this.prevPath;

            if (path2 == null && path1 != null){
                notCommonNodes = path1.get("nodes");
            }else if (path1==null && path2==null){
                return;
            }else if (path1==null && path2!=null){
                notCommonNodes = path2.get("nodes");
            }else{
                nodes1 = path1.get("nodes");
                length1 = nodes1.length;
                for(n=length1; n--;){
                    tmpNode = nodes1[n];
                    if (!arrayContains(path2, tmpNode)){
                        notCommonNodes.push(tmpNode);
                    }
                }
                nodes2 = path2.get("nodes");
                length2 = nodes2.length;
                for(n=length2; n--;){
                    tmpNode = nodes2[n];
                    if (!arrayContains(path1, tmpNode)){
                        notCommonNodes.push(tmpNode);
                    }
                }
            }
            this.eventAggregator.trigger('arcDeviationRedrawRequired', notCommonNodes);
        },

        removeMyArcs: function(){
            for (var n=0;n<this.drawnArcs.length;n++){
                this.drawnArcs[n].drawn=false;
            }
        },

        restoreCondition: function(event){
            this.removeMyArcs();
            this.path = event.get("prevPath"); //The new state is the previous one

            if (this.path != null){

                this.svgPath.attr({ path: this.computePathString(this.path.get("nodes"), false) });
                this.svgPath.toBack();

            }else{

                this.visible = false;
                this.setVisibility();

            }

            this.updateAllEdgeInCommon(this);
            this.prevPath = this.path;
        },

        getLineStrokeStyle: function(){
            return (this.static==true)?this.environment.config.graph.pathStaticStrokeDasharray:this.environment.config.graph.pathDefaultStrokeDasharray;
        },

        isEdgeDrawn: function(arcs){ //There is at least a drawn arc for this tree on this edge?
            for (var n= 0; n<arcs.length; n++){
                if (arcs[n].drawn==true && arcs[n].subTreeId==this.subTreeId)
                    return arcs[n];
            }
            return false;
        },

        getMyArc: function(arcs){
            var myArc, length;
            length = arcs.length;
            for (var n=length; n--;){
                if (arcs[n].key == this.key){
                    myArc = arcs[n];
                    break;
                }
            }
            return myArc;
        },

        /**
         * This method manages the animation of a path involved in an event.
         * @method updatePath
         * @param {Object} event An instance of Event
         */
        updatePath: function(event){
            var nodes, notNullPath;

            this.path = event.get("path");

            if (!this.animateNextEvent){
                this.updateWithoutAnimation(true);
            }else{

                if (this.static == true){
                    this.inFront();
                }

                notNullPath = (this.path || this.prevPath);

                if (notNullPath){
                    nodes = notNullPath.get("nodes");
                    for (var n=0,length=nodes.length; n<length; n++){
                        nodes[n].view.view.attr({opacity: 1});
                    }
                }

                switch (event.get("subType")) {
                    case "withdrawal":
                        this.animateRemove();
                        break;
                    case "announce":
                        this.animateNewPath(event);
                        break;
                    case "pathchange":
                        this.removeMyArcs();
                        this.animatePathChange(event); //Animate the transition between two routes
                        break;
                    case "reannounce":
                        this.animateMinorChanges(event); //Do something to highlight the involved path
                        break;
                    case "prepending":
                        this.animateMinorChanges(event);
                        break;
                    default:
                        this.updateWithoutAnimation(false);
                        break;
                }
            }
        },

        /**
         * This method updates the SVG representing the path without animating it.
         * @method updateWithoutAnimation
         * @param {Boolean} prune An optional boolean to allow or not the pruning function
         */
        updateWithoutAnimation: function(prune){
            if (this.svgPath && this.path) {
                this.svgPath.attr({"path": this.computePathString(this.path.get("nodes"), prune)});
            }
        },

        /**
         * This method updates the visibility of the SVG representing the path.
         * @method setVisibility
         */
        setVisibility: function(){
            if (this.visible != true){
                this.svgPath.hide();
            }else{
                this.svgPath.show();
            }
        },

        /**
         * This method executes the first draw of the SVG representing the path.
         * @method firstDraw
         */
        firstDraw: function(){
            var pathString;

            pathString = this.computePathString(this.path.get("nodes"), true);

            this.svgPath = this.paper.path(pathString)
                .attr({stroke:this.graphView.getPathColor(this), fill:"none",
                    "stroke-width":this.environment.config.graph.pathWeight,
                    "stroke-dasharray":this.getLineStrokeStyle()});

            this.path.view = this.svgPath;
            this.paper.graphSet.push(this.svgPath);
            this.setVisibility();

            this.svgPath.toBack();
            $(this.svgPath.node).css("cursor","pointer");
            this.svgEventManager();
        },

        inFront: function(){
            if (this.path != null){
                var nodes = this.path.get("nodes");
                this.svgPath.attr({ "path": this.computeStaticPathString(nodes, true, false) });
            }
        },

        selectSVGPath: function(){
            var nodes;

            if (this.path != null && this.visible){
                this.setSvgStyle({opacity: 1});

                nodes = this.path.get("nodes");
                for (var n=0, length=nodes.length; n<length; n++){
                    nodes[n].view.setSvgStyle({opacity: 1});
                }
            }

        },

        setSvgStyle: function(style){
            var view = this.svgPath;

            if (view!=null && this.visible){
                for(var key in style){ //it is a map!
                    if (view.attr(key) != style[key]){ //There is a difference
                        view.attr(style);
                        break;
                    }
                }
            }
        },

        /**
         * This method manages the SVG events.
         * @method svgEventManager
         */
        svgEventManager: function(){
            var $this = this;
            this.svgPath.click(function(event){
                $this.eventAggregator.trigger("clickOnPath", $this);
            });

            this.svgPath.mouseover(function(evt){
                eventStopPropagation(evt);
                $this.mouseOverTimer = setTimeout(
                    function(){
                        $this.eventAggregator.trigger("styleElement",{opacity: $this.environment.config.graph.notSelectedElementOpacity});

                        if ($this.subTreeId != null){
                            $this.eventAggregator.trigger("subTreeSelected", $this.subTreeId);
                        }else{
                            $this.eventAggregator.trigger("pathSelected", $this);
                            $this.setSvgStyle({"stroke-width": $this.environment.config.graph.pathBold});
                        }
                    },
                    $this.environment.config.graph.pathMouseoverMilliseconds);
            });

            this.svgPath.mouseout(function(evt){
                clearTimeout($this.mouseOverTimer);
                eventStopPropagation(evt);
                $this.eventAggregator.trigger("pathReleased", $this);
                $this.eventAggregator.trigger("styleElement", {opacity: 1});
                $this.setSvgStyle({"stroke-width": $this.environment.config.graph.pathWeight});
            });


        },

        /**
         * This method computes the SVG representing a dynamic path.
         * @method computeDynamicPathString
         * @param {Array} nodes An array of nodes
         * @param {Boolean} prune An optional boolean to allow or not the pruning function
         * @return {String} An SVG path
         */
        computeDynamicPathString: function(nodes, prune){
            var pathString, orderedNodes, node1, node2, reversed, skipAfterHops, sameEdge, myArc, pruneByWeight;

            pathString = "";
            skipAfterHops = this.environment.GraphView.skipAfterHops;
            pruneByWeight = this.environment.GraphView.pruneByWeight;

            for (var n=0,length=nodes.length-1; n<length; n++){

                node1 = nodes[n];
                node2 = nodes[n + 1];

                if (node1.id == node2.id) //It is a fake point, skip it!
                    continue;

                orderedNodes = this.graphView.graph.utils.absOrientation(node1, node2);
                reversed = (orderedNodes[0].id == node2.id);
                sameEdge = this.graphView.graph.edges.get({vertexStart: orderedNodes[0].view, vertexStop: orderedNodes[1].view});

                myArc = this.getMyArc(sameEdge);

                if (!prune || sameEdge.length > pruneByWeight) {
                    myArc.beforeHopsLimit = (length - n <= skipAfterHops);

                    if (!prune || myArc.beforeHopsLimit) {
                        pathString += this.getArcDeviationPathString(orderedNodes[0], orderedNodes[1], reversed, null);
                    }
                }

            }
            return pathString;
        },

        /**
         * This method computes the SVG representing a path.
         * @method computeNormalPathString
         * @param {Array} nodes An array of nodes
         * @return {String} An SVG path
         */
        computeNormalPathString: function(nodes){
            var pathString, node;
            pathString = "";
            for (var i=0; i<nodes.length; i++){
                node = nodes[i];
                pathString += (pathString == "") ? "M" : " L";
                pathString += (node.view) ? node.view.x + " " + node.view.y : node.x + " " + node.y;
            }
            return pathString;
        },

        /**
         * This method dispatches a computation of an SVG path to a more specific method.
         * @method computePathString
         * @param {Array} nodes An array of nodes
         * @param {Boolean} prune An optional boolean to allow or not the pruning function
         * @return {String} An SVG path
         */
        computePathString: function(nodes, prune){
            var pathString = "";

            if (this.visible == true){
                if (this.static == true){
                    pathString = this.computeStaticPathString(nodes, false, prune);
                }else{
                    pathString = this.computeDynamicPathString(nodes, prune);
                }
            }
            return pathString;
        },

        /**
         * This method computes the SVG representing a static path.
         * @method computeStaticPathString
         * @param {Array} nodes An array of nodes
         * @param {Boolean} forceToBeInFront An optional boolean to force the path to be the first of the beam
         * @param {Boolean} prune An optional boolean to allow or not the pruning function
         * @return {String} An SVG path
         */
        computeStaticPathString: function(nodes, forceToBeInFront, prune){
            var node1, node2, myArc, sameEdge, drawnEdge, orderedNodes, reversed, pathString, drawnEdge_old,
                skipAfterHops, pruneByWeight;

            pathString = "";
            skipAfterHops = this.environment.GraphView.skipAfterHops;
            pruneByWeight = this.environment.GraphView.pruneByWeight;

            for (var n=0,length=nodes.length-1; n<length; n++){

                node1 = nodes[n];
                node2 = nodes[n + 1];

                orderedNodes = this.graphView.graph.utils.absOrientation(node1, node2);
                reversed = (orderedNodes[0].id == node2.id);
                sameEdge = this.graphView.graph.edges.get({vertexStart: orderedNodes[0].view, vertexStop: orderedNodes[1].view});
                drawnEdge = this.isEdgeDrawn(sameEdge);

                if (forceToBeInFront == true && drawnEdge != false && drawnEdge.key != this.key) { // Hide the old edge

                    drawnEdge_old = drawnEdge;
                    drawnEdge = this.getMyArc(sameEdge);
                    drawnEdge.drawnPosition = drawnEdge_old.drawnPosition;
                    drawnEdge_old.drawn = false;
                    drawnEdge.drawn = true;

                    this.graphView.pathViews[drawnEdge_old.key].updateWithoutAnimation(true);

                }

                drawnEdge.beforeHopsLimit = (length - n <= skipAfterHops);

                if (!prune || sameEdge.length > pruneByWeight){
                    if (!prune || !drawnEdge || drawnEdge.beforeHopsLimit) {
                        if (drawnEdge == false || drawnEdge.key == this.key) {
                            myArc = this.getMyArc(sameEdge);
                            pathString += this.getArcDeviationPathString(orderedNodes[0], orderedNodes[1], reversed, myArc);
                        }
                    }
                }
            }
            return pathString;
        },

        /**
         * This method returns a set of ordered arcs that must be drawn between a nodes pair.
         * @method getDrawnArcs
         * @param {Array} sameEdge An array of arcs
         * @param {Object} myArc The arc belonging to this PathView
         * @return {String} An SVG path
         */
        getDrawnArcs: function(sameEdge, myArc){
            var drawnArcs = [];
            if (this.environment.config.graph.staticDeviation == false){
                for (var h=0, length=sameEdge.length; h<length; h++){
                    if (sameEdge[h].drawn == true){
                        drawnArcs.push(sameEdge[h]);
                        sameEdge[h].drawnPosition = drawnArcs.length - 1; //Sets the drawn position (i.e. this arc is the 4th arc drawn for this edge)
                    }
                }
            }else{
                myArc.drawnPosition = arrayContains(sameEdge, myArc);
                return sameEdge;
            }
            return drawnArcs;
        },

        /**
         * This method assigns to each arcs a deviation in order to avoid overlap between arcs belonging to different paths.
         * @method getArcDeviationPathString
         * @param {Object} node1 An instance of Node
         * @param {Object} node2 An instance of Node
         * @param {Boolean} reversed True if the provided nodes are not sorted
         * @param {Object} myArc The arc belonging to this PathView
         * @return {String} An SVG path
         */
        getArcDeviationPathString: function(node1, node2, reversed, myArc){
            var  unitVector, leftVector, finalVector, newPosition1, newPosition2, sameEdge, pathAndInterline, half;
            sameEdge = this.graphView.graph.edges.get({vertexStart:node1.view, vertexStop:node2.view});

            var myArc = myArc || this.getMyArc(sameEdge);
            myArc.drawn = true;

            this.drawnArcs.push(myArc);

            sameEdge = this.getDrawnArcs(sameEdge, myArc);

            if (this.environment.config.graph.patInterlineDistributed){
                pathAndInterline = this.environment.config.graph.pathWeight + (this.beamWidth/sameEdge.length);
            }else{
                pathAndInterline = this.environment.config.graph.pathWeight + this.environment.config.graph.pathInterline;
            }

            if (this.environment.config.graph.arcsBeamMaxWidth && (pathAndInterline*sameEdge.length)>this.environment.config.graph.nodeHeight){
                pathAndInterline = this.environment.config.graph.nodeHeight/sameEdge.length;
            }

            half = (sameEdge.length - 1)/2;

            myArc.deviation = ((myArc.drawnPosition-half) * pathAndInterline);

            unitVector = this.graphView.graph.utils.unitVector(node1.view, node2.view);

            leftVector = this.graphView.graph.utils.leftUnitVector(unitVector);

            leftVector = (reversed == true) ? this.graphView.graph.utils.inverseVector(leftVector) : leftVector;

            finalVector = this.graphView.graph.utils.mulVectorForValue(leftVector, myArc.deviation);

            newPosition1 = {x: node1.view.x + finalVector.x, y: node1.view.y + finalVector.y};
            newPosition2 = {x: node2.view.x + finalVector.x, y: node2.view.y + finalVector.y};

            myArc.pathString = this.computeNormalPathString([newPosition1, newPosition2]);

            return myArc.pathString;
        },

        /**
         * Provided two paths, this method pushes fake points in order to return equidimensional paths.
         * @method addFakePoints
         * @param {Object} An instance of Path (1)
         * @param {Object} An instance of Path (2)
         * @return {Array} An array of equidimensional path [path1,path2]
         */
        addFakePoints: function(realPath1, realPath2){
            var fakePath1, fakePath2, fakePoints, absFakePoints;

            fakePath1 = realPath1.slice(0);//clone
            fakePath2 = realPath2.slice(0);//clone
            fakePoints = realPath1.length - realPath2.length;
            absFakePoints = Math.abs(fakePoints);

            if (fakePoints > 0){
                for (var n=0; n<absFakePoints; n++)
                    fakePath2.push(fakePath2[fakePath2.length-1]);
            }else if (fakePoints < 0){
                for (var n=0; n<absFakePoints; n++)
                    fakePath1.push(fakePath1[fakePath1.length-1]);
            }
            return [fakePath1, fakePath2];
        },

        /**
         * This method animates a path when it is going to be removed.
         * The SVG path blinks and disappears
         * @method animateRemove
         */
        animateRemove: function(){
            this.eventAggregator.trigger("graphAnimationComplete", false);

            var $this, pathBold, animation1, animation2, sum, delays;

            $this = this;
            pathBold = 10;
            animation1 = Raphael.animation({"stroke-width": pathBold});
            animation2 = Raphael.animation({"stroke-width": this.environment.config.graph.pathWeight});
            sum = 0;
            delays = this.environment.config.graph.animationPathWithdrawalDelays;

            for (var n=0; n<delays.length-1; n++){
                sum += delays[n]/this.animationSpeed;
                this.svgPath.animate(animation1.delay(sum));

                sum += delays[n+1]/this.animationSpeed;
                this.svgPath.animate(animation2.delay(sum));
            }

            setTimeout(function(){
                $this.visible = false;
                $this.setVisibility();
                $this.removeMyArcs();
                $this.updateAllEdgeInCommon($this);
                $this.eventAggregator.trigger("graphAnimationComplete", true);
            }, (sum + delays[0]) / this.animationSpeed);

        },

        /**
         * This method animates a path when it is going to be involved in a minor change.
         * The SVG path blinks.
         * @method animateMinorChanges
         */
        animateMinorChanges:function(event){ //A single blink
            this.eventAggregator.trigger("graphAnimationComplete", false);

            var animation1, animation2, delays, sum, $this;

            $this = this;
            sum = 0;
            this.visible = true;
            this.setVisibility();
            animation1 = Raphael.animation({"stroke-width": $this.environment.config.graph.pathBold});
            animation2 = Raphael.animation({"stroke-width": $this.environment.config.graph.pathWeight});

            delays = $this.environment.config.graph.animationMinorChangesDelays;

            for (var n=0; n<delays.length-1; n++){
                sum += delays[n]/this.animationSpeed;
                this.svgPath.animate(animation1.delay(sum));

                sum += delays[n+1]/this.animationSpeed;
                this.svgPath.animate(animation2.delay(sum));
            }
            setTimeout(function(){
                $this.updateAllEdgeInCommon($this);
                $this.eventAggregator.trigger("graphAnimationComplete", true);
            },sum + delays[0]/this.animationSpeed);
        },

        /**
         * This method animates a path that was just drawn.
         * @method animateNewPath
         */
        animateNewPath: function(event){
            this.eventAggregator.trigger("graphAnimationComplete", false);

            var newPath, pathBold, incrementalPath, $this, nodes, delay, i;
            newPath = event.get("path");

            this.visible = true;
            this.setVisibility();
            pathBold = this.environment.config.graph.pathBold;
            incrementalPath = [];
            $this = this;
            nodes = newPath.get("nodes");
            delay = this.environment.config.graph.animationPathInsertionDelay/this.animationSpeed;

            incrementalPath.push(nodes[0]);

            for (i=1; i<nodes.length; i++){
                incrementalPath.push(nodes[i]);
                this.svgPath.animate((Raphael.animation({
                    "stroke-width": pathBold,
                    path: this.computePathString(incrementalPath, false)})).delay(delay*(i-1)));
            }

            setTimeout(function(){
                $this.svgPath.toBack();
                $this.svgPath.attr({"stroke-width": $this.environment.config.graph.pathWeight, path: $this.computePathString(incrementalPath, true)});
                $this.updateAllEdgeInCommon($this);
                $this.path = newPath;
                $this.eventAggregator.trigger("graphAnimationComplete", true);
            }, delay * i);
        },

        /**
         * This method animates a path when it is going to be involved in a change of its route.
         * @method animatePathChange
         */
        animatePathChange: function(event){//path change ANIMATION
            var newPath, oldPath, $this, pathString, fakePaths;

            newPath = event.get("path");
            oldPath = event.get("prevPath");
            this.visible = true;
            this.setVisibility();
            this.eventAggregator.trigger("graphAnimationComplete", false);
            $this = this;
            fakePaths = this.addFakePoints(newPath.get("nodes"), oldPath.get("nodes"));
            pathString = this.computeNormalPathString(fakePaths[1]);
            this.svgPath.attr({path:pathString, "stroke-width": this.environment.config.graph.pathBold}); //Add the same number of points to the already drawn path

            this.svgPath.animate({"path": this.computeNormalPathString(fakePaths[0])}, $this.environment.config.graph.animationPathChangeDelay/this.animationSpeed, function(){ //we use the normal pathString function
                $this.svgPath.toBack();
                $this.path = newPath;
                pathString = $this.computePathString(fakePaths[0], false); //Redraw the path after the animation to assign the right deviation. We use the complex pathString function
                $this.svgPath.attr({path:pathString, "stroke-width": $this.environment.config.graph.pathWeight}); //Redraw
                $this.updateAllEdgeInCommon($this);
                $this.eventAggregator.trigger("graphAnimationComplete", true); //Morphing
            });
        },

        /**
         * This method provides percentages about the stability of the source-target pair in terms of sets of nodes involved.
         * @method getStatistics
         */
        getStatistics: function(){

            if (this.statistics != null) {
                return this.statistics;
            }

            this.statistics = "";
            var eventsInvolvingThisPath, pathChangesInvolvingThisPath, $this, totalTime, percentage, lastChange;

            $this = this;

            eventsInvolvingThisPath = this.source.get("events")[this.target.id];
            pathChangesInvolvingThisPath = eventsInvolvingThisPath.getFilteredSubTreeMapByValue(function(event){
                return event.get("subType") == "pathchange";
            });


            totalTime = this.bgplay.get("endtimestamp") - this.bgplay.get("starttimestamp");
            lastChange = this.bgplay.get("starttimestamp");
            pathChangesInvolvingThisPath.forEach(function(event){
                if (event.get("subType") == "pathchange"){
                    percentage = ((event.get('instant').get('timestamp')-lastChange)/totalTime)*100;
                    if (percentage >= 1){
                        lastChange = event.get('instant').get('timestamp');
                        $this.statistics += percentage.roundTo(2)+"%: " + event.get("path").toString()+" | ";
                    }
                }
            });


        }
    });

    return PathView;
});