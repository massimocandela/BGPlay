/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * This is a module specific for BGP.
 * It provides the query form.
 * Template: controller.html
 * @class ControllerView
 * @module modules
 */

define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "controller.html.js"

    ],  function(){


        var ControllerView = Backbone.View.extend({
            events:function(){
                return {
                    "click .bgplayControlAnimationStart":"toggle",
                    "click .bgplayControlAnimationPause":"toggle",
                    "click .bgplayControlAnimationRepeat":"repeat",
                    "click .bgplayControlAnimationStop":"stopButton",
                    "click .bgplayControlAnimationPrev":"previousEvent",
                    "click .bgplayControlAnimationNext":"nextEvent",
                    "mouseover .bgplayControlPanelDivFlagIco":"mouseOverFlag",
                    "mouseout .bgplayControlPanelDivFlagIco":"mouseOutFlag",
                    "click .bgplayControlPanelDivFlagIco":"clickOnFlag",
                    "change input[name=bgplayControlPrefixValues]":"validateIp",
                    "click .bgplayControlDiscardButton":"discardConfig",
                    "click .bgplayControlApplyButton":"updateConfig",
                    "click .bgplayControlPrefixMore":"morePrefixTextbox",
                    "click .bgplayControlPrefixDelete":"lessPrefixTextbox"
                }
            },

            /**
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize:function(){
                this.environment=this.options.environment;
                this.bgplay=this.environment.bgplay;
                this.fileRoot=this.environment.fileRoot;
                this.imageRoot = this.environment.imageRoot;
                this.eventAggregator=this.environment.eventAggregator;


                this.animation=false;
                this.allEvents=this.bgplay.get("allEvents");

                this.prefixes=stringToArray(this.environment.params.targets);
                this.selectedRrcs=stringToArray(this.environment.params.selectedRrcs);

                this.selectableRrcs=this.environment.config.selectableRrcs;
                this.possibleRrcs=removeSubArray(this.environment.config.possibleRrcs,this.selectedRrcs);

                this.slideOpened=false;
                this.showResourceController = this.environment.params.showResourceController;

                this.ignoreReannouncements = this.environment.params.ignoreReannouncements;
                this.releasedPlayButton=true;
                this.environment.dynamicParams.push('instant');
                this.startAnimationInstant=new Instant({id:0, timestamp:this.bgplay.get("starttimestamp")});
                this.stopAnimationInstant=new Instant({id:0, timestamp:this.bgplay.get("endtimestamp")});

                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.bgplay.on("change:cur_instant",function(){
                    if (this.environment.config.controller.keepTrackCurrentInstant==true){
                        var instant = this.bgplay.get("cur_instant");
                        this.environment.params.instant = instant.toString();
                        //this.environment.jsonWrap.setParams(this.environment.params);
                        //this.environment.thisWidget.navigate();
                        //this.environment.jsonWrap.setParams(this.environment.params);

                        /*
                         try{
                         if (this.environment.paramsInUrl==true && this.environment.instances==1){
                         //setUrlParam('instant',instant.toString(),false);
                         //window.history.replaceState({"html":this.bgplay.html,"pageTitle":'BGPlayjs'},"", currentUrl);
                         }
                         }catch(e){
                         log("This browser does not support the replaceState function.");
                         }
                         */
                    }
                },this);

                this.eventAggregator.trigger("autoStartFunction",
                    {func:
                                  function(){
                                      var initialInstant, id, timestamp;
                                      initialInstant = this.environment.params.instant || getUrlParam("instant");
                                      if (initialInstant != null && initialInstant!="" && this.environment.instances==1){
                                          initialInstant = initialInstant.split(',');
                                          id = initialInstant[0];
                                          timestamp = initialInstant[1];
                                          if (id!=null && timestamp!=null && id == parseInt(id) && timestamp == parseInt(timestamp)){
                                              this.bgplay.set({"cur_instant":new Instant({id:id, timestamp:timestamp})});
                                          }
                                      }
                                  }
                        , context:this});

                this.eventAggregator.on("animationEnd", function(){
                    this.stop();
                },this);

                this.eventAggregator.on("animationReload", function(){
                    this.reload();
                },this);

                this.eventAggregator.on("newSelectionStart", function(value){
                    this.startAnimationInstant=value;
                },this);

                this.eventAggregator.on("releasePlayButton", function(release){
                    this.releasedPlayButton=release;
                    if (this.releasedPlayButton==true){
                        this.controlAnimationStartPauseDiv.css('cursor','auto');
                    }else{
                        this.controlAnimationStartPauseDiv.css('cursor','wait');
                    }
                },this);

                this.eventAggregator.on("newSelectionEnd", function(value){
                    this.stopAnimationInstant=value;
                },this);

                var $this = this;
                $('body').keydown(function(evt){
                    if ((evt.ctrlKey || evt.shiftKey) && !$this.animation){
                        $this.repeatLastEvent = true;
                        $this.update();
                    }
                }).keyup(function(evt){
                        $this.repeatLastEvent = false;
                        $this.update();
                    });

                this.render();
                log("Controller view loaded.");
                this.eventAggregator.trigger("moduleLoaded", this);
            },

            /*
             * This method creates the pointers to the DOM elements.
             */
            getDomElements:function(){
                this.dom = this.$el;
                this.controlAnimationStartPauseDiv = this.dom.find('.bgplayControlAnimationStartPause');
                this.controlAnimationStart = this.controlAnimationStartPauseDiv.find('.bgplayControlAnimationStart');
                this.controlAnimationPause = this.controlAnimationStartPauseDiv.find('.bgplayControlAnimationPause');
                this.controlAnimationRepeatEvent = this.controlAnimationStartPauseDiv.find('.bgplayControlAnimationRepeat');

                this.controlAnimationStop = this.dom.find('.bgplayControlAnimationStop');
                this.controlAnimationNext = this.dom.find('.bgplayControlAnimationNext');
                this.controlAnimationPrevImage = this.dom.find('.bgplayControlAnimationPrev img');
                this.controlPrefixDiv = this.dom.find('.bgplayControlPrefixDiv');
                this.starttimestampPicker = this.dom.find('.bgplayStarttimestampPicker');
                this.endtimestampPicker = this.dom.find('.bgplayEndtimestampPicker');
                this.controlPanelDivFlagIco = this.dom.find('.bgplayControlPanelDivFlagIco');
                this.controlPanelDivComplete = this.dom.find('.bgplayControlPanelDivComplete');
                this.suppressReannounce = this.dom.find('.bgplaySuppressReannounce');
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render:function(){
                parseTemplate(this.environment,'controller.html',this,this.el);
                this.getDomElements();
                this.dom.show();
                this.update();
                if (this.controlPrefixDiv.length>0)
                    this.controlPrefixDiv.tinyscrollbar({axis:'y'});

                this.starttimestampPicker.datetimepicker({
                    changeMonth: true,
                    changeYear: true,
                    hideIfNoPrevNext:true,
                    timeFormat:'HH:mm:ss',
                    separator:' ',
                    dateFormat:'yy-mm-dd',
                    showSecond: true,
                    maxDate: "+0"

                });

                this.starttimestampPicker.datetimepicker("setDate", dateToUTC(this.bgplay.get("starttimestamp")));

                this.endtimestampPicker.datetimepicker({
                    changeMonth: true,
                    changeYear: true,
                    hideIfNoPrevNext:true,
                    timeFormat:'HH:mm:ss',
                    separator:' ',
                    dateFormat:'yy-mm-dd',
                    showSecond: true,
                    maxDate: "+0"
                });

                this.endtimestampPicker.datetimepicker("setDate", dateToUTC(this.bgplay.get("endtimestamp")));

                return this;
            },

            /**
             * This method updates the DOM of the Control Panel without render it again.
             * @method update
             */
            update:function(){
                if (this.animation==true){
                    this.controlAnimationPrevImage.hide();
                    this.controlAnimationNext.hide();
                    this.controlAnimationStart.hide();

                    this.controlAnimationPause.show();
                    this.controlAnimationStop.show();

                    this.controlAnimationRepeatEvent.hide();
                }else{
                    this.controlAnimationStop.hide();
                    this.controlAnimationPause.hide();

                    if (!this.repeatLastEvent){
                        this.controlAnimationStart.show();
                        this.controlAnimationRepeatEvent.hide();
                    }else{
                        this.controlAnimationStart.hide();
                        this.controlAnimationRepeatEvent.show();
                    }

                    this.controlAnimationPrevImage.show();
                    this.controlAnimationNext.show();
                }
            },

            /**
             * If this method is invoked during an animation then the animation pauses otherwise the animation starts.
             * @method toggle
             */
            toggle:function(){
                if (!this.releasedPlayButton){
                    return;
                }

                this.closeFlag();
                if (this.bgplay.get("cur_instant").get("timestamp") < this.stopAnimationInstant.get("timestamp")){
                    this.animation=!this.animation;
                    this.update();
                    this.eventAggregator.trigger("animate", this.animation);
                }
            },

            /**
             * This method reloads the animation.
             * @method reload
             */
            reload:function(){
                this.bgplay.setCurInstant(this.startAnimationInstant);
                this.eventAggregator.trigger("checkPathPosition");
            },

            /**
             * This method repeats the last one event.
             * @method repeat
             */
            repeat:function(){
                var isInitial;
                this.eventAggregator.trigger("animateNextEvent", false);
                isInitial = (this.previousEvent() == false);
                this.eventAggregator.trigger("animateNextEvent", true);
                if (!isInitial){
                    this.nextEvent();
                }
            },

            /**
             * This method stops and reloads the animation.
             * @method stopButton
             */
            stopButton:function(){
                this.stop();
                this.reload();
            },

            /**
             * This method stops the animation.
             * @method stop
             */
            stop:function(){
                this.animation=false;
                this.eventAggregator.trigger("animate", false);
                this.update();
            },

            /**
             * This method applies the previous event.
             * @method previousEvent
             */
            previousEvent:function(){
                var prevInstant, prevEvent, instant;
                instant = this.bgplay.get("cur_instant");
                prevEvent = this.allEvents.nearest(instant,false,false);
                if (prevEvent!=null){
                    prevInstant = prevEvent.get("instant");
                    if (!this.environment.config.controller.disableNotSelectedInstants || this.allEvents.compare(prevInstant,this.startAnimationInstant)>=0){
                        this.bgplay.setCurInstant(prevInstant);
                    }
                }else{
                    return false;
                }
            },

            /**
             * This method applies the next event.
             * @method nextEvent
             */
            nextEvent:function(){
                var nextInstant, nextEvent, instant;
                instant = this.bgplay.get("cur_instant");
                nextEvent = this.allEvents.nearest(instant,true,false);
                if (nextEvent!=null){
                    nextInstant = nextEvent.get("instant");
                    if (!this.environment.config.controller.disableNotSelectedInstants || this.allEvents.compare(nextInstant,this.stopAnimationInstant)<=0){
                        this.bgplay.setCurInstant(nextInstant);
                    }
                }
            },

            /**
             * This method validates an IP/prefix inserted in the query form.
             * @method validateIp
             * @return {Boolean} True if the given IP is valid
             */
            validateIp:function(){
                var out, val, $this;
                out=true;
                $this=this;
                this.dom.find("input[name=bgplayControlPrefixValues]").each(function(){
                    val=$(this).val();
                    if (! (validateIpv4and6Prefix(val) || validateIpv4and6Address(val) || validateAS(val))){
                        $this.environment.cssAlert.alert('Malformed prefix/ip/AS.<br/>A valid ip for ipv4 or ipv6 possibly with netmask is required. You can also use AS numbers (be careful).','validation');
                        out=false;
                    }
                });
                return out;
            },

            /**
             * This method validates the query form.
             * @method validateAll
             * @return {Boolean} True if the data inserted in the query form is valid
             */
            validateAll:function(){
                //A trick to solve a bug of the timepicker add-on (I'm triggering a keyUp to force the update of the date)
                this.starttimestampPicker.keyup();
                this.endtimestampPicker.keyup();

                return (this.validateIp() || !this.showResourceController) && this.validateInterval() && this.validateRrcs();
            },

            /**
             * This method validates the time interval.
             * @method validateInterval
             * @return {Boolean} True if the time interval is valid
             */
            validateInterval:function(){
                if (this.starttimestampPicker.datepicker("getDate").getTime()>this.endtimestampPicker.datepicker("getDate").getTime()){
                    this.environment.cssAlert.alert("The end date is before the start date.<br/>Wait a minute, Doc. Ah... Are you telling me that you built a time machine... out of a DeLorean?","validation");
                    return false;
                }
                return true;
            },

            /**
             * This method validates a set of route collectors
             * @method validateRrcs
             * @return {Boolean} True if the set of RRCs is valid
             */
            validateRrcs:function(){
                if (this.selectableRrcs){
                    var rrcSelected=[];
                    this.dom.find('input[name=bgplayRrcSelect]:checked').each(function(){
                        rrcSelected.push($(this).val());
                    });
                    if (rrcSelected.length==0){
                        this.environment.cssAlert.alert("You must select at least one rrc.","validation");
                        return false;
                    }
                }
                return true;

            },
            mouseOverFlag:function(){
                if (this.slideOpened==false)
                    this.controlPanelDivFlagIco.attr('src', this.imageRoot + 'openSlide.png');
            },
            mouseOutFlag:function(){
                if (this.slideOpened==false)
                    this.controlPanelDivFlagIco.attr('src', this.imageRoot + 'config.png');
            },
            clickOnFlag:function(){
                if (this.slideOpened==false){
                    this.openFlag();
                }else{
                    this.discardConfig();
                }
            },
            openFlag:function(){
                if (this.slideOpened==false){
                    var $this=this;
                    this.dom.animate({height:'+=340'}, 600, function() {
                        $this.dom.animate({width:'+=150'},300,function(){
                            $this.controlPanelDivComplete.show();
                            $this.controlPanelDivFlagIco.attr('src', $this.imageRoot + 'closeSlide.png');
                            if ($this.controlPrefixDiv.length>0)
                                $this.controlPrefixDiv.tinyscrollbar_update();
                        });
                    });
                    this.slideOpened=true;
                }
            },
            closeFlag:function(){
                if (this.slideOpened==true){
                    var $this=this;
                    this.controlPanelDivComplete.hide();
                    this.dom.animate({height:'-=340'}, 600, function() {
                        $this.dom.animate({width:'-=150'},300,function(){
                            $this.controlPanelDivFlagIco.attr('src', $this.imageRoot + 'config.png');
                        });
                    });
                    this.slideOpened=false;
                }
            },
            morePrefixTextbox:function(){
                var element=this.dom.find(".bgplayControlPrefixValue>div>div").first();
                var parent=element.parent();
                element.clone().appendTo(parent).find('input').val("");
                if (this.controlPrefixDiv.length>0)
                    this.controlPrefixDiv.tinyscrollbar_update('bottom');
            },
            lessPrefixTextbox:function(event){
                var element=$(event.target);
                if (this.dom.find(".bgplayControlPrefixValue>div>div").length>1){
                    element.parent().remove();
                    if (this.controlPrefixDiv.length>0)
                        this.controlPrefixDiv.tinyscrollbar_update();
                }else{
                    element.parent().find('input').val("");
                }
            },

            /**
             * This method discards the new query parameters
             * @method discardConfig
             */
            discardConfig:function(){
                this.closeFlag();
                this.render();
            },

            /**
             * This method applies the new query parameters
             * @method updateConfig
             */
            updateConfig:function(){
                if (!this.environment.params.preventNewQueries==false){
                    this.discardConfig();
                    return;
                }
                var internalParams, rrcSelected, $this, externalParams;
                if (this.validateAll()==true){
                    $this = this;
                    this.prefixes = new Array();
                    this.dom.find(".bgplayControlPrefixValue input[type=text]").each(function(){
                        $this.prefixes.push($(this).val());
                    });

                    rrcSelected=[];
                    this.dom.find('input[name=bgplayRrcSelect]:checked').each(function(){
                        rrcSelected.push($(this).val());
                    });

                    this.ignoreReannouncements = this.suppressReannounce.is(':checked');

                    if (this.environment.thisWidget!=null){
                        internalParams={};

                        if (this.showResourceController) internalParams.targets = arrayToString(this.prefixes);
                        internalParams.starttimestamp = Math.round(this.starttimestampPicker.datetimepicker("getDate").getTime()/1000) - ((new Date()).getTimezoneOffset()*60);//Math.round(dateToUTC(this.starttimestampPicker.datetimepicker("getDate").getTime()/1000).getTime()/1000);
                        internalParams.endtimestamp = Math.round(this.endtimestampPicker.datetimepicker("getDate").getTime()/1000) - ((new Date()).getTimezoneOffset()*60);
                        internalParams.ignoreReannouncements = this.ignoreReannouncements;
                        internalParams.selectedRrcs = arrayToString(rrcSelected);
                        internalParams.instant = null; //the new query will start from the initial instant

                        externalParams = this.environment.jsonWrap.setParams(internalParams);

                        if (!areMapsEquals(internalParams, this.environment.params, this.environment.dynamicParams)){
                            this.environment.oldParams = this.environment.params;
                            document.location="?resource=" + internalParams.targets +"&starttime=" + internalParams.starttimestamp +"&endtime=" + internalParams.endtimestamp +"&ignoreReannouncements="+ internalParams.ignoreReannouncements +"&rrcs=" + internalParams.selectedRrcs;
                            //this.environment.thisWidget.(externalParams);
                            //this.closeFlag(); //If the widget was not updated then the query parameters are the same, close the flag
                            //this.eventAggregator.trigger("destroyAll");
                        }else{
                            this.discardConfig();
                        }
                    }
                }
            }

        });

        return ControllerView;
    });