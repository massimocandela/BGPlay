/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * OptionAnimationSpeedView pushes in the option panel the animation speed control
 * @class OptionAnimationSpeedView
 * @module modules
 */

define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "optionAnimationSpeed.html.js"

    ],  function(){

        var OptionAnimationSpeedView = Backbone.View.extend({

            /*
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize:function(){
                this.environment=this.options.environment;
                this.bgplay=this.environment.bgplay;
                this.fileRoot=this.environment.fileRoot;
                this.eventAggregator=this.environment.eventAggregator;



                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.dom = this.environment.optionPopupDom;
                this.render();
                this.eventAggregator.trigger("moduleLoaded", this);
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render:function(){
                var $this, sliderDom, sliderValue;
                $this = this;
                parseTemplate(this.environment, 'optionAnimationSpeed.html', this, this.dom, "prepend");

                sliderDom = this.dom.find('.animationSpeedSlider');
                sliderValue = this.dom.find('.animationSpeedSliderValue');
                sliderDom.slider({
                    orientation: "horizontal",
                    range: "min",
                    min: 1,
                    max: 10,
                    value: 1,
                    slide: function( event, ui ) {
                        sliderValue.val(ui.value);
                        $this.eventAggregator.trigger('animationSpeedChanged', ui.value);
                    }
                });
                return this;
            }
        });

        return OptionAnimationSpeedView;
    });