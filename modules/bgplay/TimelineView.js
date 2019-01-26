/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * Template: timeline.html
 * @class TimelineView
 * @module modules
 */
define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "timeline.html.js"

    ],  function(){

        var TimelineView = Backbone.View.extend({
            events:function(){
                return {
                    "click .bgplayTimelineControlCanvas": "updateCursorPosition",
                    "click .bgplayTimelineSelectionCanvas": "updateSelectedEvent",
                    "click .bgplayTimelineSelectionNext": "nextSelectionChart",
                    "click .bgplayTimelineSelectionPrev": "prevSelectionChart"
                }
            },

            /**
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize: function(){
                this.environment = this.options.environment;
                this.bgplay = this.environment.bgplay;
                this.fileRoot = this.environment.fileRoot;
                this.imageRoot = this.environment.imageRoot;
                this.eventAggregator = this.environment.eventAggregator;


                printLoadingInformation(this.environment,"Drawing timelines.");
                this.$el.show();
                this.eventAggregator = this.environment.eventAggregator;
                this.allEvents = this.bgplay.get("allEvents");
                this.selectionChartPage = 0;
                this.stopTriggerEvents = false;
                this.offsetOfVisibilityOnSelectionTimeline = this.environment.config.timeline.offsetOfVisibilityOnSelectionTimeline;
                this.eventOnSelectionChart = new net.webrobotics.TreeMap(comparator,{allowDuplicateKeys:false,suppressDuplicateKeyAlerts:true});

                if (this.environment.domWidth < 480){
                    this.$el.hide();
                }

                this.selectionChartWidth = this.environment.config.timeline.minSelectionChartWidth;
                this.controlChartHeight = this.environment.config.timeline.controlChartHeight;
                this.selectionChartHeight = this.environment.config.timeline.selectionChartHeight;
                this.cursorsWidth = this.environment.config.timeline.controlChartCursorsWidth;
                this.halfCursorWidth = this.environment.config.timeline.controlChartCursorsWidth/2;
                this.halfWarpWidth = this.environment.config.timeline.timeWarpWidth/2;

                this.seekTimers = [];
                this.selectedIntervalCursorColor = this.environment.config.timeline.selectedIntervalCursorColor;
                this.animation = false; //No animation at initialization
                this.selectionStart = new Instant({id: 0, timestamp: this.bgplay.get("starttimestamp")});
                this.selectionEnd = new Instant({id: 0, timestamp: this.bgplay.get("endtimestamp")});
                this.selectionFirstStart = this.selectionStart;
                this.selectionFirstEnd = this.selectionEnd;
                this.animationSpeed = 1;
                this.globalTimeOffset = this.bgplay.get("endtimestamp") - this.bgplay.get("starttimestamp");

                this.graphAnimationsOngoing = 0;

                this.eventsManager();

                this.render();
                log("Timelines loaded.");
            },

            listeners: function(){
                return {
                    "destroyAll": this.destroyMe,

                    "animate": function(start){
                        this.stopAnimation();
                        this.animation = start;
                        this.animate();
                    },

                    "newSample": function(instant) {
                        var $this = this;
                        if ($this.environment.streamingOn) {
                            if (this.strUpdateTimer) {
                                clearTimeout(this.strUpdateTimer);
                            }

                            this.strUpdateTimer = setTimeout(function () {
                                $this.selectionChartPage = $this.calculateSelectionChartPageByTimestamp(instant);
                                $this.drawControlChart();
                                $this.drawSelectionChart($this.selectionChartPages(true)[$this.selectionChartPage], true);

                                $this.bgplay.setCurInstant(instant);

                            }, this.environment.config.graph.strUpdateTimer);
                        }
                    },

                    "animationSpeedChanged": function(value){
                        this.animationSpeed = value;
                    },

                    "allAnimationsCompleted": function(parameters){
                        this.controlCanvasDom.css("cursor", "pointer");
                        this.selectionCanvasDom.css("cursor", "pointer");
                        this.stopTriggerEvents = false;
                        this.animate();
                    },

                    "graphAnimationComplete": function(value){
                        if (value == false){
                            this.controlCanvasDom.css("cursor", "wait");
                            this.selectionCanvasDom.css("cursor", "wait");
                            this.stopTriggerEvents = true;
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

                this.bgplay.on('change:cur_instant', function(){
                    this.updateControlCanvas();
                    this.scrollSelectionCanvas(this.bgplay.get("cur_instant"));
                    this.updateSelectionCanvas();
                },this);


                this.eventAggregator.trigger("autoStartFunction",
                    {
                        func:
                            function(){
                                this.updateSelectionCanvas();
                            }
                        , context:this
                    }
                );

            },

            /*
             * This method creates the pointers to the DOM elements.
             */
            getDomElements: function(){
                this.timelineControlCanvasDate = this.dom.find('.bgplayTimelineControlCanvasDate');
                this.timelineControlCanvasText = this.dom.find('.bgplayTimelineControlCanvasText');
                this.controlCanvasDom = this.dom.find('.bgplayTimelineControlCanvas');
                this.selectionCanvasDom = this.dom.find('.bgplayTimelineSelectionCanvas');
                this.timelineSelectionDiv = this.dom.find('.bgplayTimelineSelectionDiv');
                this.timelineControlCanvasSlider = this.dom.find(".bgplayTimelineControlCanvasSlider");
                this.timelineSelectionNext = this.dom.find('.bgplayTimelineSelectionNext');
                this.timelineSelectionPrev = this.dom.find('.bgplayTimelineSelectionPrev');
                this.timelineSelectionWaitIco = this.dom.find('.bgplayTimelineSelectionWaitIco');
                this.timelineControlCanvasSliderLeft = this.dom.find(".bgplayTimelineControlCanvasSliderLeft");
                this.timelineControlCanvasSliderRight  = this.dom.find(".bgplayTimelineControlCanvasSliderRight");
                this.timelineSelectionSliderLeft=this.dom.find('.bgplayTimelineSelectionSliderLeft');
                this.timelineSelectionSliderRight=this.dom.find('.bgplayTimelineSelectionSliderRight');
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render: function(){
                this.dom = this.$el;
                this.selectionChartContainerWidth = this.dom.width()-90;
                this.selectionChartWidth = this.selectionChartContainerWidth;
                this.controlChartWidth = this.dom.width();
                this.sliderLeftPosition = 0;
                this.sliderRightPosition = this.controlChartWidth;

                parseTemplate(this.environment, 'timeline.html', this, this.el);
                this.getDomElements();

                this.drawControlChart();
                this.drawSelectionChart();
                this.updateControlCanvas();
                this.timelineSelectionDiv.width(this.selectionChartContainerWidth);

                var $this = this; //The stop function needs only 2 parameters (event and ui), inside this function 'this' refers to the DOM element dragged
                this.timelineControlCanvasSlider.draggable({
                    axis:"x",
                    stop: function(event, ui){
                        $this.confirmSlidersSelection($this);
                    },
                    drag: function(event, ui){
                        return $this.checkSliderSelection(event, $this);
                    }
                });

                this.selectionCanvasDom.draggable({
                    axis:"x",
                    stop: function(){
                        $this.miniArrowsManager($this);
                    },
                    drag: function(event, ui){
                        var container, element, elementLeft, elementRight;

                        element = $(event.target);
                        container = element.parent();
                        elementLeft = element.position().left;
                        elementRight = element.position().left + element.width();

                        if (elementLeft > 0){
                            element.css('left', '0');
                            return false;
                        }
                        if (elementRight < container.width()){
                            element.css('left', container.width() - element.width());
                            return false;
                        }
                    }
                });
                return this;
            },

            /**
             * This method returns the next event in the timeline.
             * @method nextEvent
             * @param {Object} An instance of Instant
             * @param {Boolean} If this optional parameter is true then the next event will be the first of the next block
             * @return {Object} An instance of Event
             */
            nextEvent: function(instant, forceNotCumulative){
                var nextInstant, event;

                var forceNotCumulative = forceNotCumulative || false;

                if (this.environment.config.cumulativeAnimations && forceNotCumulative == false){
                    event = this.nextEvent(instant, true); //The real next event

                    if (event != null){
                        nextInstant = new Instant({id: 0, timestamp: event.get("instant").get("timestamp") + 1});
                        event = this.allEvents.nearest(nextInstant, true, true); //The next event of this group of events

                        if (event != null){
                            nextInstant = new Instant({id: event.get("instant")-1, timestamp: event.get("instant").get("timestamp")});
                        }else{
                            nextInstant = new Instant({id: 0, timestamp: this.bgplay.get("endtimestamp")});
                        }
                        event = this.allEvents.nearest(nextInstant, false, true); //The last event of this group
                    }
                }else{
                    event = this.allEvents.nearest(instant, true, false);
                }

                return event;
            },

            /**
             * This method manages the animation of the time cursor along the timeline.
             * @method seek
             * @param {Object} An instance of Instant which will be the final position of the time cursor
             * @param {Float} The duration of the animation
             */
            seek: function(instant, delay){
                var fps, $this, curTimestamp, timeOffset, interval, totalFrames, fixedStep;

                fps = this.environment.config.timeline.timelineCursorFps;
                $this = this; //A local copy of this

                curTimestamp = this.bgplay.get("cur_instant").get("timestamp");
                timeOffset = instant.get("timestamp")-curTimestamp;

                if (timeOffset <= 0){  //backward, fast jump
                    $this.bgplay.setCurInstant(instant,false);
                    return null;
                }

                delay = (delay * 1000); //Seconds to milliseconds

                interval = Math.ceil(1000 / fps);
                totalFrames = Math.ceil(delay / interval);
                if (totalFrames < 1){
                    totalFrames = 1;
                }

                fixedStep = timeOffset / totalFrames;

                for(var i=1; i<=totalFrames; i++) {
                    (function() {
                        var n = i;
                        function seekInTime(){  //Remember: this function is "an instance" of a function, all vars are local clones
                            var newTimestamp= curTimestamp+(fixedStep*n);
                            if (totalFrames==n){ //When totalFrames==n the cursor has reached the final seek position
                                /*
                                 * We can't check $this.animation in order to trigger the event because $this.animation is a static
                                 * clone (doesn't change after its allocation) of this.animation.
                                 */
                                if ($this.allEvents.compare(instant, $this.selectionEnd) >= 0){

                                    //No more events in the timeline, the animation stops
                                    $this.animation = false;
                                    $this.eventAggregator.trigger("animationEnd");
                                    if ($this.environment.config.timeline.reloadAnimationWhenItEnds){
                                        $this.eventAggregator.trigger("animationReload");
                                    }else{
                                        $this.bgplay.setCurInstant($this.selectionEnd,false);
                                    }
                                }else{
                                    $this.bgplay.setCurInstant(instant,false);
                                }
                            }else{
                                /*
                                 * When totalFrames!=n the cursor has reached a intermediate position calculated
                                 * by the seek function itself to emulate a fluid animation.
                                 */
                                $this.bgplay.setCurInstant(new Instant({id:0, timestamp:newTimestamp}), true);//silent=true prevents the propagation of events, there are no BGP updates to be applied
                                $this.updateSelectionCanvas();
                                $this.updateControlCanvas();//We changed the current instant, now draw the cursor at the new position.
                            }
                        }

                        /*
                         * Important: if we don't store the pointers to the timers then we can't stop animation in any way
                         */
                        $this.seekTimers.push(setTimeout(seekInTime, interval*n));
                    })();
                }
            },

            /**
             * This method is useful to calculate the duration for a seek operation with a logarithm approach.
             * @method logarithmicSeekTime
             * @param {Float} A time interval
             * @return {Float} A time interval
             */
            logarithmicSeekTime: function(offset){
                var base = this.environment.config.timeline.controlChartLogBaseWarp; //Tuning it, for 10 use common constant
                return (Math.log(Math.sqrt(Math.sqrt(offset))) / Math.log(base)) / this.animationSpeed;
            },

            finishAnimation: function(){
                var seekTime;
                //No more events in the timeline, the animation stops
                this.animation = false;

                // Ok, the animation stops, but the cursor must reach the full scale or rather the endtimestamp
                var timestampOffsetToEnd = this.selectionEnd.get("timestamp") - this.bgplay.get("cur_instant").get("timestamp"); //In seconds
                seekTime = Math.ceil(this.logarithmicSeekTime(timestampOffsetToEnd));
                this.seek(this.selectionEnd,seekTime);
            },

            /**
             * This method starts the animation of the timeline.
             * The animation of the timeline is a set of consecutive seek invocation.
             * @method animate
             */
            animate: function(){

                if(this.animation != true){
                    this.stopAnimation();
                    return;
                }

                var seekTime, tmpEvent, timestampOffsetToNextEvent;

                tmpEvent = this.nextEvent(this.bgplay.get("cur_instant"), false);

                if (tmpEvent == null){
                    this.finishAnimation();
                    return;
                }

                //Seconds between the current event and the next event on the treeMap
                timestampOffsetToNextEvent = tmpEvent.get("instant").get("timestamp") - this.bgplay.get("cur_instant").get("timestamp"); //In seconds

                if (timestampOffsetToNextEvent < 2){  //this can be also <5 (equal for humans)
                    this.seek(tmpEvent.get("instant"), 0); //Move the pointer to the new timestamp in 0 sec
                }else{
                    seekTime = Math.ceil(this.logarithmicSeekTime(timestampOffsetToNextEvent)); //Calculate the log of the offset for a faster seek
                    this.seek(tmpEvent.get("instant"), seekTime); //Move the pointer to the new timestamp in seekTime sec
                }
            },

            /**
             * This method returns the number of events occurring between two unix timestamps.
             * @method getNumberOfEventsBetween
             * @param {Integer} A unix timestamp
             * @param {Integer} A unix timestamp
             * @return {Integer} The number of events
             */
            getNumberOfEventsBetween: function(start, end){
                var subTreeMap = this.allEvents.getSubTreeMap(new Instant({id:1, timestamp:start}), new Instant({id: 0, timestamp: (end + 1)}));
                return (subTreeMap) ? subTreeMap.size() : 0;
            },

            /**
             * This method prints information about the timeline.
             * @method writeTimelineInfo
             * @param {String} Information
             */
            writeTimelineInfo: function(text, fontColor, fontStyle){
                this.timelineControlCanvasText.html(text);
                /*
                 var ctx=this.contextControlCanvas;
                 ctx.fillStyle = fontColor;
                 ctx.font = fontStyle;
                 ctx.textBaseline = 'top';
                 ctx.fillText(text, 5, 0);
                 */
            },

            /**
             * This method prints information about the position of the time cursor.
             * @method writeTimelineDate
             */
            writeTimelineDate: function($this){
                $this.timelineControlCanvasDate.html("Current instant: " + dateToString(this.bgplay.get("cur_instant").get("timestamp")));
                /*
                 var ctx=this.contextControlCanvas;
                 ctx.fillStyle = this.environment.config.timeline.timelineDateColor;
                 ctx.font = this.environment.config.timeline.timelineDateFont;
                 ctx.textBaseline = 'top';
                 ctx.fillText(dateToString(this.bgplay.get("cur_instant").get("timestamp")), 480, 0);
                 */
            },

            drawControlChart: function(){
                var fontColor, peakColor, rulerColor, fontStyle, lineColor, lineWidth, rulerNotchWidth, timeOffset, pointY,
                    unit2time, numberOfIntervals, canvas, ctx, rulerUnitHeight, infoCanvasHeight, peak, eventHeight,
                    graph2YZero, rulerPosition, amount, amountStr, ntime2pixel, npixel2time, numEvent, maxEventHeight;

                this.unit2pixel = this.environment.config.timeline.controlChartRulerUnitWidth; //1 unit on the ruler takes N pixels
                this.cursorColor = this.environment.config.timeline.controlChartCursorsColor;

                fontColor = this.environment.config.timeline.fontColor; //"#000000";
                peakColor = this.environment.config.timeline.peakColor; //"#FFFFFF";//for now
                rulerColor = this.environment.config.timeline.rulerColor; //"#000000";
                fontStyle = this.environment.config.timeline.fontStyle; //"bold 11px Arial";
                lineColor = this.environment.config.timeline.lineColor; //"blue";
                lineWidth = this.environment.config.timeline.lineWidth; //0.6;
                rulerNotchWidth = this.environment.config.timeline.rulerNotchWidth; //0.8;
                timeOffset = this.bgplay.get("endtimestamp") - this.bgplay.get("starttimestamp");
                this.globalCursorTimeOffset = this.controlChartWidth / this.globalTimeOffset;
                unit2time = timeOffset / (this.controlChartWidth / this.unit2pixel); //Number of seconds represented by a unit on the ruler
                numberOfIntervals = Math.ceil(timeOffset / unit2time); //Number of intervals needed to represent the timeOffset
                canvas = this.controlCanvasDom[0];

                if (this.contextControlCanvas) {
                    this.contextControlCanvas.clearRect(0, 0, canvas.width, canvas.height);
                    this.selectionEnd = new Instant({id: 0, timestamp: this.bgplay.get("endtimestamp")});
                } else {
                    this.contextControlCanvas = canvas.getContext('2d');
                }

                ctx = this.contextControlCanvas;

                rulerUnitHeight = this.environment.config.timeline.controlChartRulerUnitHeight;
                infoCanvasHeight = this.environment.config.timeline.infoCanvasHeight; //13;
                peak = 0;
                graph2YZero = this.environment.config.timeline.controlChartHeight - rulerUnitHeight - 2; //The 0 in the Y axis of the graph2

                //draw the ruler
                rulerPosition = this.controlChartHeight - rulerUnitHeight;
                amount = getAmountOfTime(timeOffset);
                amountStr = "";
                if (amount.days > 0) amountStr = amountStr + amount.days + " days ";
                if (amount.hours > 0) amountStr = amountStr + amount.hours + " hours ";
                if (amount.minutes > 0) amountStr = amountStr + amount.minutes + " minutes ";
                amountStr = amountStr + amount.seconds + " seconds";
                //Unit: ~"+Math.round(unit2time)+" seconds.
                //this.writeTimelineInfo("From "+dateToString(this.bgplay.get("starttimestamp"))+" to "+dateToString(this.bgplay.get("endtimestamp"))+" ("+amountStr+") ["+(this.allEvents.size()-1)+" events]",fontColor,fontStyle); //-1 because the initial state is an event
                this.writeTimelineInfo("Period: " + amountStr + " [" + (this.allEvents.size()-1) + " events]", fontColor, fontStyle); //-1 because the initial state is an event
                ctx.fillStyle = "black";
                maxEventHeight = this.controlChartHeight + infoCanvasHeight - rulerUnitHeight;

                //Draw the first ruler's notch
                ctx.fillRect(0, rulerPosition, rulerNotchWidth, rulerUnitHeight);

                for(var n=0; n<numberOfIntervals; n++){
                    ntime2pixel = n * this.unit2pixel;
                    npixel2time = n * unit2time;
                    //In the same for we can calculate the number event peak
                    numEvent = this.getNumberOfEventsBetween(
                        this.bgplay.get("starttimestamp") + npixel2time,
                        this.bgplay.get("starttimestamp") + npixel2time + unit2time
                    );

                    if (numEvent > peak){
                        peak = numEvent;
                    }

                    //Draw the ruler units
                    ctx.fillStyle = rulerColor;
                    ctx.fillRect(ntime2pixel, rulerPosition, rulerNotchWidth, rulerUnitHeight);
                }

                eventHeight = maxEventHeight / peak;
                ctx.beginPath();
                ctx.moveTo(0, graph2YZero);
                for(var n=0; n<numberOfIntervals; n++){
                    ntime2pixel = n * this.unit2pixel;
                    npixel2time = n * unit2time;
                    var pointX = ntime2pixel;
                    var numOfEvents = this.getNumberOfEventsBetween(
                        this.bgplay.get("starttimestamp") + npixel2time,
                        this.bgplay.get("starttimestamp") + npixel2time + unit2time
                    );
                    pointY = Math.abs((eventHeight * numOfEvents) - (this.controlChartHeight - rulerUnitHeight - 2));
                    ctx.lineTo(pointX, pointY);

                    /*
                     //Draw a background for the peak
                     if (numOfEvents==peak){
                     ctx.fillStyle = peakColor;
                     ctx.fillRect(Math.abs(n-1)*this.unit2pixel+1,infoCanvasHeight,(this.unit2pixel*2)-1,this.controlChartHeight-infoCanvasHeight);
                     ctx.fillStyle=rulerColor;
                     ctx.fillRect(ntime2pixel,rulerPosition,rulerNotchWidth,rulerUnitHeight);
                     }
                     */
                }
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = lineColor;
                ctx.stroke();
                this.controlCanvasCache = ctx.getImageData(0, 0, canvas.width, canvas.height);
            },

            /**
             * This method draws the Selection Timeline
             * @method drawSelectionChart
             */
            drawSelectionChart: function(nextFirstStep, keepPosition){
                var canvas, ctx, prevEvent, fontStyle, second2pixel, lineHeight, timeWarpWidth, legendPositionX, legendWidth,
                    uniqueEventTypeLegend, selectionChartHeight, nextEvent, position, drawnEvents, sameTimestampEvent;

                fontStyle = this.environment.config.timeline.fontStyle;
                second2pixel = this.environment.config.timeline.selectionChartSecondToPixels; //how many pixels for a second?
                lineHeight = this.selectionChartHeight - 14;
                timeWarpWidth = this.environment.config.timeline.timeWarpWidth;
                legendPositionX = 100;
                legendWidth = 90;
                uniqueEventTypeLegend = [];
                selectionChartHeight = this.selectionChartHeight;
                nextEvent = nextFirstStep || this.allEvents.at(0);
                position = 0;
                drawnEvents = this.environment.config.timeline.maxSelectionChartEvents;
                sameTimestampEvent = []; //An array of events with the same timestamp (1 second)

                this.manageSelectionChartArrows(); //Draw arrows

                this.eventOnSelectionChart.empty(); //Empty the TreeMap containing the events shown in the chart

                this.selectionCanvasCache = null;

                canvas = this.selectionCanvasDom[0];
                if (this.contextSelectionCanvas == null){
                    ctx = canvas.getContext('2d');
                    this.contextSelectionCanvas = ctx;
                } else {
                    ctx = this.contextSelectionCanvas;
                    ctx.save();
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, this.selectionChartWidth, this.selectionChartHeight);
                    ctx.restore();
                }

                if (!keepPosition) {
                    this.selectionCanvasDom.css("left", "0"); //Reset canvas position
                }

                while (nextEvent != null && drawnEvents > 0){

                    if (sameTimestampEvent[0] != null && sameTimestampEvent[0].get("instant").get("timestamp") != nextEvent.get("instant").get("timestamp")){ //If the next event isn't in the same second
                        position = drawSameTimestampEvents(this, position); //Draw this set of events with the same timestamp
                        drawWarp(this.imageRoot, position, timeWarpWidth, this, nextEvent.get("instant").get("timestamp") - sameTimestampEvent[0].get("instant").get("timestamp")); //Draw the temporal warp (arrows)
                        position += timeWarpWidth; //The position of the next event
                        sameTimestampEvent = []; //Empty this set
                        drawnEvents--;
                    }

                    if (legendPositionX + legendWidth > this.selectionChartWidth){ //Enlarge the canvas or the next event may not fit into it
                        updateCanvasWidth(canvas, this, legendPositionX + legendWidth);
                    }

                    legendPositionX = drawLegend(nextEvent.get("subType"), legendPositionX, this, legendWidth); // Draw the legend
                    sameTimestampEvent.push(nextEvent);

                    prevEvent = nextEvent;//If the next iteration fails then this is the last treated event
                    nextEvent = this.nextEvent(nextEvent.get("instant"), true);

                    if (position + second2pixel + timeWarpWidth > this.selectionChartWidth){ //Enlarge the canvas or the next event may not fit into it
                        updateCanvasWidth(canvas, this, second2pixel + timeWarpWidth);
                    }
                }

                if (drawnEvents > 0) {
                    position = drawSameTimestampEvents(this, position);
                }

                if (nextEvent == null){//prevEvent is the last one event of the whole analyzed period
                    var finalInterval = this.bgplay.get("endtimestamp") - prevEvent.get("instant").get("timestamp");
                    if (finalInterval > 0){
                        drawWarp(this.imageRoot, position, timeWarpWidth, this, finalInterval);
                    }
                }

                this.drawIntervalOnSelectionCanvas();

                ctx.fillStyle = this.environment.config.timeline.fontColor;
                ctx.fillRect(0, selectionChartHeight - 1, this.selectionChartWidth, 1);
                ctx.fillRect(1, 5, second2pixel, 1);
                ctx.fillRect(1, 3, 1, 4);
                ctx.fillRect(second2pixel, 3, 1, 4);
                ctx.font = fontStyle;
                ctx.textBaseline = 'top';
                ctx.fillText("1 sec", second2pixel + 5, 0);

                function updateCanvasWidth(canvas, env, width){
                    env.selectionCanvasCache = ctx.getImageData(0, 0, env.selectionChartWidth, env.selectionChartHeight);
                    env.selectionChartWidth += width;
                    canvas.width = env.selectionChartWidth;
                    ctx.save();
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, env.selectionChartWidth, env.selectionChartHeight);
                    ctx.restore();
                    ctx.putImageData(env.selectionCanvasCache, 0, 0);
                    env.selectionCanvasCache = null;
                }

                function drawLegend(eventType,position, env, legendWidth){
                    if(arrayContains(uniqueEventTypeLegend, eventType)){
                        return position;
                    }
                    uniqueEventTypeLegend.push(eventType);
                    ctx = env.contextSelectionCanvas;
                    ctx.beginPath();
                    ctx.rect(position, 1, 10, 10);
                    ctx.fillStyle = env.getEventColor(eventType);
                    ctx.fill();
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = env.environment.config.timeline.fontColor;
                    ctx.stroke();
                    position += 13;
                    ctx.fillStyle = env.environment.config.timeline.fontColor;
                    ctx.font = fontStyle;
                    ctx.textBaseline = 'top';
                    ctx.fillText(env.getEventVerboseType(eventType), position, 0);
                    return position + legendWidth;
                }

                function drawSameTimestampEvents(env, position){
                    var internalWidth = ((second2pixel - (sameTimestampEvent.length + 1)) / sameTimestampEvent.length); //pixels for each event in this second - 1px of margin between each event

                    //Draw a group of events
                    for(var internalPosition=0; internalPosition<sameTimestampEvent.length; internalPosition++){
                        var eventTmp = sameTimestampEvent[internalPosition];
                        var eventPositionXTmp = (internalWidth * internalPosition) + position + internalPosition + 1;
                        ctx.fillStyle = env.getEventColor(eventTmp.get("subType"));
                        eventTmp.drawEventOnselectionCanvasX = eventPositionXTmp;
                        eventTmp.drawEventOnselectionCanvasY = selectionChartHeight - lineHeight;
                        eventTmp.drawEventOnselectionCanvasWidth = internalWidth;
                        eventTmp.drawEventOnselectionCanvasHeight = lineHeight;
                        env.eventOnSelectionChart.put(eventTmp.drawEventOnselectionCanvasX, eventTmp);
                        ctx.fillRect(eventTmp.drawEventOnselectionCanvasX, eventTmp.drawEventOnselectionCanvasY, eventTmp.drawEventOnselectionCanvasWidth, eventTmp.drawEventOnselectionCanvasHeight);
                    }
                    position += second2pixel;
                    return position;
                }

                function drawWarp(imageRoot, position, width, env, offset){ //width can be useful with a more complex warp representation
                    var image, posY, ctx
                    image = imageRoot + "/warp.gif";
                    image = "data:image/gif;base64,R0lGODlhCgAKAKIAADMzM93d3bCwsGZmZv/M/////wAAAAAAACH5BAEHAAQALAAAAAAKAAoAAAMfSLrcM22NAtW7gZIRus+PIIqdAAEoGghANLARgcZRAgA7";
                    ctx = env.contextSelectionCanvas;

                    if (env.warpImageCache == null){
                        var img = new Image();
                        img.onload = function() {
                            env.warpImageCache = img;
                            draw(position, env, width, offset);
                        };
                        img.src = image;
                    }else{
                        return draw(position, env, width, offset);
                    }

                    function draw(position, env, width, offset){
                        var textPositionY, amount, halfHeightWarpImage;
                        ctx.fillStyle = env.environment.config.timeline.warpFontColor;
                        ctx.font = env.environment.config.timeline.warpFont;
                        ctx.textBaseline = 'top';
                        textPositionY = lineHeight / 5;
                        amount = getAmountOfTime(offset);
                        halfHeightWarpImage = env.warpImageCache.height / 2;
                        posY = Math.round(env.selectionChartHeight / 3) - halfHeightWarpImage;

                        position += 2;//margin
                        //ctx.drawImage(env.warpImageCache,position,posY);
                        ctx.drawImage(env.warpImageCache,position,posY*2);
                        //ctx.drawImage(env.warpImageCache,position,posY*3);

                        position+=13; //17
                        if (amount.days>0) ctx.fillText(amount.days + " d", position, textPositionY * 2);
                        if (amount.hours>0) ctx.fillText(amount.hours + " h", position, textPositionY * 3);
                        if (amount.minutes>0) ctx.fillText(amount.minutes + " m", position, textPositionY * 4);
                        if (amount.seconds>0) ctx.fillText(amount.seconds + " s", position, textPositionY * 5);

                        position += 24;//32
                        //ctx.drawImage(env.warpImageCache,position,posY);
                        ctx.drawImage(env.warpImageCache, position, posY * 2);
                        //ctx.drawImage(env.warpImageCache,position,posY*3);
                    }
                }
            },

            /**
             * This method draws the next page of the Selection Timeline
             * @method nextSelectionChart
             */
            nextSelectionChart: function(event){
                event.preventDefault();
                this.selectionChartPage++;
                this.drawSelectionChart(this.selectionChartPages()[this.selectionChartPage]); //Go to the next page
                this.updateSelectionCanvas();
            },

            /**
             * This method draws the previous page of the Selection Timeline
             * @method prevSelectionChart
             */
            prevSelectionChart: function(event){
                event.preventDefault();
                this.selectionChartPage--;
                this.drawSelectionChart(this.selectionChartPages()[this.selectionChartPage]); //Go to the previous page
                this.updateSelectionCanvas();
            },

            /**
             * This method creates an array of events each of which is the first of the related page.
             * @method selectionChartPages
             * @return {Array} Array of events
             */
            selectionChartPages: function(force){
                var numberOfPages, n, nop, differentTimestampEvents;
                differentTimestampEvents = [];
                if (force || !this.selectionChartPagesList){
                    this.selectionChartPagesList = [];
                    nop = this.environment.config.timeline.maxSelectionChartEvents;

                    this.allEvents.forEachKey(function(key){
                        if (!arrayContains(differentTimestampEvents,key.getTimestamp()))
                            differentTimestampEvents.push(key.getTimestamp());
                    });

                    numberOfPages = Math.ceil(differentTimestampEvents.length/nop);
                    for (n=0; n<numberOfPages; n++){ //This calculates all pages
                        this.selectionChartPagesList[n] = this.allEvents.nearest(new Instant({id: 0, timestamp: differentTimestampEvents[n * nop]}), true);
                    }
                }
                return this.selectionChartPagesList;
            },

            /**
             * This method manages the arrows useful to change the page of the Selection Timeline.
             * @method manageSelectionChartArrows
             */
            manageSelectionChartArrows: function(){
                if (this.selectionChartPage > 0){
                    this.timelineSelectionPrev.show();
                }else{
                    this.timelineSelectionPrev.hide();
                }

                if (this.selectionChartPage < this.selectionChartPages().length - 1){
                    this.timelineSelectionNext.show();
                }else{
                    this.timelineSelectionNext.hide();
                }
            },


            /**
             * This method updates the representation of the Control Timeline
             * @method updateControlCanvas
             */
            updateControlCanvas: function(){
                var positionX, ctx, timeOffsetPosition, timestampOffsetPosition

                if (this)
                    var $this = this; //else $this must be declared by the calling function (do not separate declaration from initialization)

                timeOffsetPosition = (this.bgplay.get("cur_instant").get("timestamp") - this.bgplay.get("starttimestamp"));
                timestampOffsetPosition = timeOffsetPosition + this.bgplay.get("starttimestamp");

                if (this.environment.config.timeline.disableNotSelectedInstants == false || timestampOffsetPosition>=$this.selectionStart.get("timestamp") && timestampOffsetPosition<=$this.selectionEnd.get("timestamp")){
                    ctx=$this.contextControlCanvas;
                    ctx.putImageData($this.controlCanvasCache, 0, 0);
                    positionX = ($this.globalCursorTimeOffset * timeOffsetPosition) - (this.cursorsWidth / 2);

                    //Draw the margins for the selected interval
                    ctx.fillStyle = $this.selectedIntervalCursorColor;
                    ctx.fillRect(this.sliderLeftPosition, 0, this.cursorsWidth, this.selectionChartHeight);
                    ctx.fillRect(this.sliderRightPosition, 0, this.cursorsWidth, this.selectionChartHeight);

                    if (this.environment.config.timeline.darkenDisabledTimeline){
                        ctx.globalAlpha = 0.3;
                        ctx.fillStyle = $this.environment.config.timeline.fontColor;
                        ctx.fillRect(0, 0, this.sliderLeftPosition, this.selectionChartHeight);
                        ctx.fillRect(this.sliderRightPosition, 0, this.controlChartWidth, this.selectionChartHeight);
                        ctx.globalAlpha = 1;
                    }

                    //Draw the time cursor
                    ctx.fillStyle = $this.cursorColor;
                    ctx.fillRect(positionX, 0, $this.cursorsWidth, $this.controlChartHeight);

                    $this.writeTimelineDate($this);
                }
            },

            /**
             * This method updates the representation of the Selection Timeline
             * @method updateSelectionCanvas
             */
            updateSelectionCanvas: function(){
                var selectedEventColor, ctx, cursorPosition, curInstant, eventTmp;

                selectedEventColor = this.environment.config.timeline.eventSelectedColor;
                ctx = this.contextSelectionCanvas;

                if (this.selectionCanvasCache == null){
                    this.selectionCanvasCache = ctx.getImageData(0, 0, this.selectionChartWidth, this.selectionChartHeight);
                }else{
                    ctx.putImageData(this.selectionCanvasCache, 0, 0);
                }

                curInstant = this.bgplay.get("cur_instant");
                eventTmp = this.allEvents.get(curInstant);

                this.drawIntervalOnSelectionCanvas();

                if (eventTmp != null && this.eventOnSelectionChart.containsValue(eventTmp)){ //The cursor is on an event
                    ctx.fillStyle = selectedEventColor;

                    ctx.fillStyle = this.cursorColor;
                    cursorPosition = eventTmp.drawEventOnselectionCanvasX + (eventTmp.drawEventOnselectionCanvasWidth / 2) - this.halfCursorWidth; //Position of the event + half of the width of the event (px) - half cursor size
                    ctx.fillRect(cursorPosition, 0, this.cursorsWidth, this.selectionChartHeight);

                }else{//The cursor is on a warp
                    eventTmp = this.allEvents.nearest(curInstant, false, true);
                    if (this.eventOnSelectionChart.containsValue(eventTmp)){
                        cursorPosition=eventTmp.drawEventOnselectionCanvasX + this.halfWarpWidth + this.environment.config.timeline.selectionChartSecondToPixels; //Position of the prev Event + the half of the width of the warp
                    }
                    ctx.fillStyle = this.cursorColor;
                    ctx.fillRect(cursorPosition, 0, this.cursorsWidth, this.selectionChartHeight);
                }
            },

            /**
             * This method returns the page of the given event.
             * @method calculateSelectionChartPage
             * @param {Object} An instance of Event
             * @return {Integer} The number of the current page
             */
            calculateSelectionChartPage: function(event){
                var pages = this.selectionChartPages();
                for (var n= 0,length=pages.length; n<length-1; n++){
                    if (pages[n + 1].get("instant").get("timestamp") > event.get("instant").get("timestamp"))
                        break;
                }
                return n;
            },

            /**
             * This method returns the page of the given event.
             * @method calculateSelectionChartPage
             * @param {Object} An instance of Instant
             * @return {Integer} The number of the current page
             */
            calculateSelectionChartPageByTimestamp: function(instant){
                var pages = this.selectionChartPages();
                for (var n= 0,length=pages.length; n<length-1; n++){
                    if (pages[n + 1].get("instant").get("timestamp") > instant.get("timestamp"))
                        break;
                }
                return n;
            },

            /**
             * This method auto-scrolls the Selection Canvas when the selected instant is represented close to a margin.
             * @method scrollSelectionCanvas
             * @param {Object} An instance of Instant
             */
            scrollSelectionCanvas: function(instant) {
                var event, curPage, container, sumVisiblePosition, subVisiblePosition, offsetOfVisibility, element,
                    realElementLeft, eventPosition, absRealElementLeft, instantVisiblePosition;


                event = this.allEvents.nearest(instant, false);
                if (event == null)
                    return null;

                curPage = this.calculateSelectionChartPage(event); //Calculate the number of the page of this event

                if (curPage != this.selectionChartPage) {
                    this.selectionChartPage = curPage;
                    this.drawSelectionChart(this.selectionChartPages()[this.selectionChartPage]); //Go to the right page
                }

                element = this.selectionCanvasDom;

                container = element.parent();
                offsetOfVisibility = (container.width() / 100) * this.offsetOfVisibilityOnSelectionTimeline;

                realElementLeft = element.position().left;

                eventPosition = event.drawEventOnselectionCanvasX;

                absRealElementLeft = Math.abs(realElementLeft);
                instantVisiblePosition = eventPosition - absRealElementLeft;
                sumVisiblePosition = instantVisiblePosition + offsetOfVisibility;
                subVisiblePosition = instantVisiblePosition - offsetOfVisibility;

                if (sumVisiblePosition <= container.width() && subVisiblePosition >= 0){
                    return null; //Is already visible
                }

                var newLeft = 0;
                if (subVisiblePosition < 0) {
                    newLeft = (absRealElementLeft - eventPosition) + realElementLeft + offsetOfVisibility;
                } else if (sumVisiblePosition > container.width()) {
                    newLeft = realElementLeft - (sumVisiblePosition - container.width());
                }

                //Check position
                if (newLeft > 0){
                    newLeft = 0;
                }

                if (newLeft + this.selectionChartWidth < container.width()){
                    newLeft = container.width() - this.selectionChartWidth;
                }

                element.animate(
                    {left: newLeft},
                    500,
                    function () {
                        //end
                    }
                );
            },

            /**
             * This method is triggered when a user changes the selection on the Control Timeline.
             * @method confirmSlidersSelection
             */
            confirmSlidersSelection: function($this){
                if (this.animation)
                    return;

                var confirmAfter = 0; //Seconds between a request and an update in order to prevent flood

                this.timelineSelectionWaitIco.show();
                this.selectionCanvasDom.hide();

                if ($this.selectionAntifloodTimer != null){
                    clearTimeout(this.selectionAntifloodTimer);
                }

                (function() {
                    function updateSelectionCanvasAntiFlood(){
                        var pixel2time, newTimestampLeft, newTimestampRight, numEvents, changedLeft, changedRight;

                        pixel2time = ($this.bgplay.get("endtimestamp") - $this.bgplay.get("starttimestamp")) / $this.controlChartWidth;
                        newTimestampLeft = Math.round($this.sliderLeftPosition * pixel2time) + $this.bgplay.get("starttimestamp");
                        newTimestampRight = Math.round($this.sliderRightPosition * pixel2time) + $this.bgplay.get("starttimestamp");

                        numEvents = $this.getNumberOfEventsBetween(newTimestampLeft, newTimestampRight);
                        $this.writeTimelineInfo("From " + dateToString(newTimestampLeft) + " to " + dateToString(newTimestampRight) + " [" + numEvents + " events]");

                        $this.eventAggregator.trigger('releasePlayButton', true);

                        if ($this.selectionStart.get("timestamp") != newTimestampLeft){
                            $this.selectionStart = new Instant({id: 0, timestamp: newTimestampLeft});
                            $this.eventAggregator.trigger("newSelectionStart", $this.selectionStart);
                            $this.bgplay.setCurInstant($this.selectionStart);
                        }

                        if ($this.selectionEnd.get("timestamp") != newTimestampRight){
                            $this.selectionEnd = new Instant({id: 0, timestamp: newTimestampRight});
                            $this.eventAggregator.trigger("newSelectionEnd", $this.selectionEnd);

                            if (newTimestampRight <= $this.bgplay.get("cur_instant").get("timestamp")){
                                $this.bgplay.setCurInstant($this.selectionStart);
                            }else {
                                $this.updateSelectionCanvas();
                                $this.updateControlCanvas();
                            }
                        }

                        $this.timelineSelectionWaitIco.hide();
                        $this.selectionCanvasDom.show();
                    }

                    $this.selectionAntifloodTimer = setTimeout(updateSelectionCanvasAntiFlood, confirmAfter * 1000);
                })();

            },

            /**
             * This method provides a color for each type of event.
             * @method getEventColor
             * @param {String} The type of an event
             */
            getEventColor: function(eventType){
                var color, mainType;

                mainType = this.bgplay.get("type");
                switch (mainType) {
                    case "traceroute": //another source type
                        break;
                    default: //bgp
                        switch (eventType) {
                            case "withdrawal":
                                color = this.environment.config.timeline.eventWithdrawalColor;
                                break;
                            case "announce":
                                color = this.environment.config.timeline.eventAnnounceColor;
                                break;
                            case "reannounce":
                                color = this.environment.config.timeline.eventReannunceColor;
                                break;
                            case "pathchange":
                                color = this.environment.config.timeline.eventPathchangeColor;
                                break;
                            case "prepending":
                                color = this.environment.config.timeline.eventPrependingColor;
                                break;
                            case "initialstate":
                                color = this.environment.config.timeline.eventInitialstateColor;
                                break;
                            default:
                                color = "black";
                        }
                }
                return color;
            },

            /**
             * This method provides a description for each type of event.
             * @method getEventVerboseType
             * @param {String} The type of an event
             */
            getEventVerboseType:function(eventType){
                var text, mainType;

                mainType = this.bgplay.get("type");
                switch (mainType) {
                    case "traceroute": //another source type
                        break;
                    default: //bgp
                        switch (eventType) {
                            case "withdrawal":
                                text = "Withdrawal";
                                break;
                            case "announce":
                                text = "Announce";
                                break;
                            case "pathchange":
                                text = "Path Change";
                                break;
                            case "reannounce":
                                text = "Re-announce";
                                break;
                            case "prepending":
                                text = "Prepending";
                                break;
                            case "initialstate":
                                text = "Initial state";
                                break;
                            default:
                                text = "event";
                        }
                }
                return text;
            },

            /**
             * This method is triggered when a user clicks on the Control Timeline in order to change the current instant
             * @method updateCursorPosition
             */
            updateCursorPosition: function(event){
                event.preventDefault();
                var instant, newTimestamp, offsetX;

                this.stopAnimation();
                this.eventAggregator.trigger("animationEnd");
                if (!this.stopTriggerEvents){
                    event = addOffset(event, null, true);
                    offsetX = event.offsetX;
                    if (this.environment.config.timeline.disableNotSelectedInstants==false || this.sliderLeftPosition<offsetX && offsetX<this.sliderRightPosition){
                        newTimestamp = Math.round(offsetX*((this.bgplay.get("endtimestamp") - this.bgplay.get("starttimestamp"))/this.controlChartWidth)) + this.bgplay.get("starttimestamp");
                        instant = new Instant({id: 0, timestamp: newTimestamp});
                        this.bgplay.setCurInstant(instant, false);
                    }
                }
            },

            /**
             * This method is triggered when a user clicks on the Selection Timeline in order to change the current event
             * @method updateSelectedEvent
             */
            updateSelectedEvent: function(event){
                event.preventDefault();
                this.environment.streamingOn = false;
                if (!this.stopTriggerEvents){
                    event = addOffset(event, null, true);
                    var offsetX, tmpEvent;
                    offsetX = event.offsetX;
                    tmpEvent = this.eventOnSelectionChart.nearest(offsetX, false, true);

                    if (this.environment.config.timeline.disableNotSelectedInstants == false ||
                        (tmpEvent.get("instant").get("timestamp") >= this.selectionStart.get("timestamp") &&
                        tmpEvent.get("instant").get("timestamp") <= this.selectionEnd.get("timestamp"))){ //If the selected event is in the selected interval

                        if (tmpEvent != null && offsetX < tmpEvent.drawEventOnselectionCanvasX + tmpEvent.drawEventOnselectionCanvasWidth){
                            this.stopAnimation();
                            this.eventAggregator.trigger("animationEnd");
                            this.bgplay.setCurInstant(tmpEvent.get("instant"));
                        }
                    }
                }
            },

            /**
             * This method stops a seek process
             * @method stopAnimation
             */
            stopAnimation: function(){
                for (var ntimer = 0, length = this.seekTimers.length; ntimer<length; ntimer++){
                    clearTimeout(this.seekTimers[ntimer]);
                }
                this.seekTimers = [];
            },

            /**
             * This method checks and prevents inconsistent selection of the Control Timeline.
             * @method checkSliderSelection
             */
            checkSliderSelection: function(event, env){
                if (this.animation == true)
                    return false;

                this.eventAggregator.trigger('releasePlayButton', false);

                var sliderLeft, sliderRight, xLeft, xRight, sliderLeftWidth, halfSliderLeft, halfSliderRight, element,
                    pixel2time, newTimestampLeft, newTimestampRight;

                sliderLeft = this.timelineControlCanvasSliderLeft;
                sliderRight = this.timelineControlCanvasSliderRight;
                xLeft = sliderLeft.position().left;
                xRight = sliderRight.position().left;

                sliderLeftWidth = sliderLeft.width();
                halfSliderLeft = sliderLeftWidth / 2;
                halfSliderRight = sliderRight.width() / 2;
                element = $(event.target);

                if (xLeft < -halfSliderLeft){
                    element.css('left', -halfSliderLeft + 'px');
                    return false;//Drag option of jquery-ui expects null or false.
                }
                if (xRight + halfSliderRight > env.controlChartWidth){
                    element.css('left', env.controlChartWidth - halfSliderRight + 'px');
                    return false;//Drag option of jquery-ui expects null or false.
                }
                if (xLeft + sliderLeftWidth > xRight){
                    if (element.position().left == xLeft){//The target is the left slider
                        element.css('left', xRight - sliderLeftWidth + 'px');
                    }else{
                        element.css('left', xLeft + sliderLeftWidth + 'px');
                    }
                    return false;
                }

                this.sliderLeftPosition = xLeft + halfSliderLeft;
                this.sliderRightPosition = xRight + halfSliderRight;

                if (this.environment.config.timeline.showSelectionInformation){
                    pixel2time = (this.bgplay.get("endtimestamp") - this.bgplay.get("starttimestamp"))/this.controlChartWidth;
                    newTimestampLeft = Math.round(this.sliderLeftPosition * pixel2time) + this.bgplay.get("starttimestamp");
                    newTimestampRight = Math.round(this.sliderRightPosition * pixel2time) + this.bgplay.get("starttimestamp");

                    this.writeTimelineInfo("From "+ dateToString(newTimestampLeft) + " to " + dateToString(newTimestampRight));
                }


            },

            /**
             * This method draws on the Selection Timeline an interval selected on the Control Timeline
             * @method drawIntervalOnSelectionCanvas
             */
            drawIntervalOnSelectionCanvas: function(){
                var start, stop, imageLeft, imageRight;

                start = this.allEvents.nearest(this.selectionStart, true, true);
                stop = this.allEvents.nearest(this.selectionEnd, false, true);
                imageLeft = this.imageRoot + "/leftSlider.png";
                imageLeft = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAABE0lEQVR42mL8//8/AyUAIICYGCgEAAHEIrmFyQBInydTvyFAALGANB/2IM8btjsYzwMEEMgAhjd/sCv49Q9Cs+HxKEAAgQ14i8OAb38hNBczA4M3z3+GrV8YMdQABBDYgNe/sRvwGSrOywqhQYYseI9qCEAA4fVCiRhm2CQI/mfoeY0wBCCAIC74Q1rgIasHCCCIC3B4Iew6xCZebgaGuXIQ1yQ/QvUCQADh9cLXHxDFP9khmv3vYQYiQADhDcRfP6GxAZS3usmIVQ1AAOGNxn9QA5jwhBFAAIEMMPh0n/ECNkkuBYjTv9xnxKXfACCAGLHlRkZGRgaJzYwoEs99/mE1BSCAcCbSF77/GQlpBgGAAAMANPRP5PIcMVgAAAAASUVORK5CYII=";

                imageRight = this.imageRoot + "/rightSlider.png";
                imageRight = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAABGUlEQVR42mL8//8/AyUAIICYGCgEAAHEIrmFyQBInydTvyFAALGANB/2IM8btjsYzwMEEMgAhjd/sCv49Q9Cs+HxKEAAgQ14i2aAN89/hq1fGBm+/YXwuZhxGwAQQGADXv9GCCQIQrwDEvsMFedlxW0AQACheKFE9D+GQSDQ85oRpwEAAQRxwR/8gYVPHiCAIC6AOjX5ESPDXLn/cPbnr1AvcOM2ACCAMGLB/x4jw0al/2Cxrz8gTv/JjjuaAQIIIxBBwOomROOvnxD+t9+4XQAQQFijEQb+QQ1gwhMGAAEEMsDg033GC9gkuRQgTv9yH2csGAAEECO23MjIyMggsZkRReK5zz+spgAEEM5E+sL3PyMhzSAAEGAAd81WDRtYSvsAAAAASUVORK5CYII=";

                var $this = this;

                if ($this.selectorLeftImageCache == null){
                    var imgLeft = new Image();
                    imgLeft.onload = function() {
                        $this.selectorLeftImageCache = imgLeft;
                        var imgRight = new Image();
                        imgRight.onload = function() {
                            $this.selectorRightImageCache = imgRight;
                            draw(start, stop);
                            $this.eventAggregator.trigger("moduleLoaded", $this);
                        };
                        imgRight.src = imageRight;
                    };
                    imgLeft.src = imageLeft;


                }else{
                    draw(start, stop);
                }

                function draw(start, stop){
                    var positionXL, positionXR, warpWidth, halfWarpWidth, sliderWidth, halfSliderWidth, ctx, darkenDisabledParts, darkened;

                    darkenDisabledParts = $this.environment.config.timeline.darkenDisabledTimeline;
                    warpWidth = $this.environment.config.timeline.timeWarpWidth;
                    halfWarpWidth = warpWidth / 2;
                    sliderWidth = $this.selectorLeftImageCache.naturalWidth;
                    halfSliderWidth = sliderWidth / 2;
                    ctx = $this.contextSelectionCanvas;

                    if ($this.selectionCanvasCache == null){
                        $this.selectionCanvasCache = ctx.getImageData(0, 0, $this.selectionChartWidth, $this.selectionChartHeight);
                    }else{
                        ctx.putImageData($this.selectionCanvasCache, 0, 0);
                    }


                    darkened = false;

                    if (start != null && $this.selectionStart != $this.selectionFirstStart && start.drawEventOnselectionCanvasX != null && $this.eventOnSelectionChart.containsValue(start)){

                        positionXL = start.drawEventOnselectionCanvasX - halfWarpWidth - halfSliderWidth; //Position of the first event included - the half of the warp - the half of the slider image

                        //Draw the margins for the selected interval
                        ctx.fillStyle = $this.selectedIntervalCursorColor;
                        ctx.fillRect(positionXL + halfSliderWidth, 0, $this.cursorsWidth, $this.selectionChartHeight);

                        if (darkenDisabledParts){
                            darkened = true;
                            ctx.globalAlpha = 0.3;
                            ctx.fillStyle = $this.environment.config.timeline.fontColor;
                            ctx.fillRect(0, 0, positionXL+halfSliderWidth, $this.selectionChartHeight);
                            ctx.globalAlpha = 1;
                        }

                        ctx.drawImage($this.selectorLeftImageCache, positionXL, 0);
                    }

                    if (stop != null && $this.selectionEnd != $this.selectionFirstEnd && stop.drawEventOnselectionCanvasX != null && $this.eventOnSelectionChart.containsValue(stop)){

                        positionXR = stop.drawEventOnselectionCanvasX + $this.environment.config.timeline.selectionChartSecondToPixels + halfWarpWidth - halfSliderWidth; //Position of the first event included + width of the event + the half of the warp - the half of the slider image

                        if (positionXR == positionXL){ //There are no events in the selected interval
                            positionXR += sliderWidth; //Without this line the two sliders will be overlapped
                        }

                        //Draw the margins for the selected interval
                        ctx.fillStyle = $this.selectedIntervalCursorColor;
                        ctx.fillRect(positionXR+halfSliderWidth, 0, $this.cursorsWidth, $this.selectionChartHeight);

                        if (darkenDisabledParts){
                            darkened = true;
                            ctx.globalAlpha = 0.3;
                            ctx.fillStyle = $this.environment.config.timeline.fontColor;
                            ctx.fillRect(positionXR + halfSliderWidth, 0, $this.selectionChartWidth, $this.selectionChartHeight);
                            ctx.globalAlpha = 1;
                        }

                        ctx.drawImage($this.selectorRightImageCache, positionXR, 0);
                    }

                    if (darkenDisabledParts && !darkened){
                        if ($this.allEvents.compare($this.eventOnSelectionChart.last().get("instant"), start.get("instant")) == -1){
                            ctx.globalAlpha = 0.3;
                            ctx.fillStyle = $this.environment.config.timeline.fontColor;
                            ctx.fillRect(0, 0, $this.selectionChartWidth, $this.selectionChartHeight);
                            ctx.globalAlpha = 1;
                        }else{
                            if ($this.allEvents.compare(stop.get("instant"), $this.eventOnSelectionChart.first().get("instant")) == -1){
                                ctx.globalAlpha = 0.3;
                                ctx.fillStyle = $this.environment.config.timeline.fontColor;
                                ctx.fillRect(0, 0, $this.selectionChartWidth, $this.selectionChartHeight);
                                ctx.globalAlpha = 1;
                            }
                        }
                    }

                    $this.miniArrowsManager($this);
                }
            },

            /**
             * This method manages the mini arrows.
             * The mini arrows are the two green arrows that appear when the timeline sliders (selectors) disappear from the visible selection timeline.
             * @method miniArrowsManager
             */
            miniArrowsManager: function($this){
                var $this = $this||this;

                var arrowLeftElement, arrowRightElement, container, leftArrow, rightArrow, canvasElementLeft, leftIsVisible, rightIsVisible;

                arrowLeftElement = this.timelineSelectionSliderLeft;
                arrowRightElement = this.timelineSelectionSliderRight;

                container = this.timelineSelectionDiv;

                leftArrow = $this.allEvents.nearest($this.selectionStart, true);
                rightArrow = $this.allEvents.nearest($this.selectionEnd, false);
                canvasElementLeft = $this.selectionCanvasDom.position().left;

                leftIsVisible = false;
                rightIsVisible = false;
                arrowRightElement.hide();
                arrowLeftElement.hide();

                if (leftArrow!=null && rightArrow!=null){

                    if ($this.eventOnSelectionChart.containsValue(leftArrow)){ //It is in the current drawn timeline
                        if (leftArrow.drawEventOnselectionCanvasX + canvasElementLeft < 0){
                            leftIsVisible = true; //It is in the current visible part of the current drawn timeline
                        }
                    }else{ //It is out
                        if ($this.eventOnSelectionChart.first().get("instant").get("timestamp") > $this.selectionStart.get("timestamp")){ //Is not in the current visible part, but it is anyway on the left (previous selection timeline page)
                            leftIsVisible = true;
                        }else{ //It is not in the current visible part, but is on the right (next selection timeline page)
                            rightIsVisible = true;
                        }
                    }

                    if ($this.eventOnSelectionChart.containsValue(rightArrow)){ //Is in the current drawn timeline
                        if (rightArrow.drawEventOnselectionCanvasX + canvasElementLeft > container.width()){
                            rightIsVisible = true; //It is in the current visible part of the current drawn timeline
                        }
                    }else{ //It is out
                        if ($this.eventOnSelectionChart.last().get("instant").get("timestamp") < $this.selectionEnd.get("timestamp")){ //It is not in the current visible part, but it is anyway on the right (next selection timeline page)
                            rightIsVisible = true;
                        }else{ //It is not in the current visible part, but is on the left (prev selection timeline page)
                            leftIsVisible = true;
                        }
                    }
                }

                if (leftIsVisible)
                    arrowLeftElement.show();

                if (rightIsVisible)
                    arrowRightElement.show();

            }
        });

        return TimelineView;
    });